'use client';

import { useEffect, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Order {
  _id: string;
  title: string;
  clientName: string;
  deadline: string;
  status: 'new' | 'in_progress' | 'completed';
  amount: number;
  images: string[];
  createdAt: string;
}

type FormState = {
  title: string;
  clientName: string;
  deadline: string;
  amount: string;
  images: string[];
};

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_META = {
  new:         { label: 'Yangi',      badge: 'bg-blue-950   text-blue-400',    dot: 'bg-blue-400'    },
  in_progress: { label: 'Jarayonda',  badge: 'bg-amber-950  text-amber-400',   dot: 'bg-amber-400'   },
  completed:   { label: 'Tugallandi', badge: 'bg-emerald-950 text-emerald-400', dot: 'bg-emerald-400' },
} as const;

const fmtDate  = (d: string) => new Date(d).toLocaleDateString('uz-UZ');
const fmtMoney = (n: number) => Math.round(n).toLocaleString('uz-UZ');
const isOverdue = (o: Order) => new Date(o.deadline) < new Date() && o.status !== 'completed';

const EMPTY_FORM: FormState = { title: '', clientName: '', deadline: '', amount: '', images: [] };

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
function StatCard({ label, value, color, icon, chip, active, onClick }: { label: string; value: number; color: string; icon: string; chip: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-left w-full bg-[#1a1d27] rounded-2xl border p-4 sm:p-5 transition ${active ? 'border-[#f0c040]' : 'border-[#2a2d3a]'} ${onClick ? 'cursor-pointer hover:border-[#3a3d4a]' : 'cursor-default'}`}
    >
      <div className="flex justify-between items-start mb-2">
        <p className="text-[#666] text-[10px] sm:text-[11px] uppercase tracking-widest m-0">{label}</p>
        <span className={`w-8 h-8 rounded-lg ${chip} ${color} flex items-center justify-center text-sm shrink-0`}>{icon}</span>
      </div>
      <p className={`text-2xl sm:text-3xl font-extrabold ${color}`} style={{ fontFamily: "'Syne', sans-serif" }}>
        {value}
      </p>
    </button>
  );
}

// ─── Status tanlash (badge ko'rinishidagi dropdown) ─────────────────────────────
const STATUS_OPTIONS: { value: Order['status']; label: string }[] = [
  { value: 'new',         label: 'Yangi'      },
  { value: 'in_progress', label: 'Jarayonda'  },
  { value: 'completed',   label: 'Tugallandi' },
];

function StatusSelect({ value, onChange }: { value: Order['status']; onChange: (s: Order['status']) => void }) {
  const meta = STATUS_META[value];
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Order['status'])}
      onClick={(e) => e.stopPropagation()}
      className={`shrink-0 rounded-lg text-[11px] sm:text-xs font-semibold px-2.5 py-1 sm:py-1.5 border-none outline-none cursor-pointer appearance-none ${meta.badge}`}
      title="Statusni o'zgartirish"
    >
      {STATUS_OPTIONS.map(o => (
        <option key={o.value} value={o.value} className="bg-[#1a1d27] text-[#e8e8e8]">
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ─── Mobile OrderCard ─────────────────────────────────────────────────────────
function OrderCard({ order, onDelete, onEdit, onImages, onStatusChange }: { order: Order; onDelete: () => void; onEdit: () => void; onImages: () => void; onStatusChange: (s: Order['status']) => void }) {
  const overdue = isOverdue(order);
  const paid = order.status === 'completed' && order.amount > 0;
  return (
    <div className={`bg-[#1a1d27] rounded-2xl border p-4 space-y-3 ${overdue ? 'border-red-900/50' : 'border-[#2a2d3a]'}`}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#14161f] flex items-center justify-center text-xl shrink-0">📦</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-snug truncate">{order.title}</p>
          <p className="text-xs text-[#555] mt-0.5">👤 {order.clientName}</p>
        </div>
        <StatusSelect value={order.status} onChange={onStatusChange} />
      </div>

      <div className="flex items-stretch gap-2">
        <div className="flex-1 bg-[#14161f] rounded-xl px-3 py-2">
          <p className="text-[10px] text-[#555] uppercase tracking-wide mb-0.5">Muddat</p>
          <p className={`text-xs font-medium ${overdue ? 'text-red-400' : 'text-[#aaa]'}`}>
            {overdue ? '⚠ ' : ''}{fmtDate(order.deadline)}
          </p>
        </div>
        <div className="flex-1 bg-[#14161f] rounded-xl px-3 py-2">
          <p className="text-[10px] text-[#555] uppercase tracking-wide mb-0.5">Narx</p>
          <p className={`text-xs font-semibold ${order.amount > 0 ? (paid ? 'text-emerald-400' : 'text-[#e8e8e8]') : 'text-[#555]'}`}>
            {order.amount > 0 ? `${fmtMoney(order.amount)}` : '—'}
          </p>
        </div>
        {order.images?.length > 0 && (
          <button
            onClick={onImages}
            className="bg-blue-950 border border-blue-800/30 text-blue-400 text-xs font-semibold px-3 rounded-xl hover:bg-blue-900 transition shrink-0"
          >
            🖼 {order.images.length}
          </button>
        )}
      </div>

      {paid && <p className="text-[11px] text-emerald-400/80 m-0">💰 Daromadga yozildi</p>}

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onEdit}
          className="py-2 rounded-xl border border-[#2a2d3a] text-[#aaa] text-xs font-semibold hover:bg-[#2a2d3a] transition"
        >
          Tahrirlash
        </button>
        <button
          onClick={onDelete}
          className="py-2 rounded-xl border border-red-900/40 text-red-400 text-xs font-semibold hover:bg-red-950/40 transition"
        >
          O'chirish
        </button>
      </div>
    </div>
  );
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────
function OrderModal({ initial, onClose, onSubmit, saving }: { initial?: Order | null; onClose: () => void; onSubmit: (f: FormState) => void; saving: boolean }) {
  const [form, setForm]         = useState<FormState>(
    initial
      ? {
          title: initial.title,
          clientName: initial.clientName,
          deadline: initial.deadline ? initial.deadline.slice(0, 10) : '',
          amount: initial.amount ? String(initial.amount) : '',
          images: initial.images || [],
        }
      : EMPTY_FORM,
  );
  const [previews, setPreviews] = useState<string[]>(initial?.images || []);
  const [uploading, setUploading] = useState(false);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append('file', file);
      const res  = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) urls.push(data.url);
    }
    setForm(prev => ({ ...prev, images: [...prev.images, ...urls] }));
    setPreviews(prev => [...prev, ...urls]);
    setUploading(false);
  };

  const removeImage = (i: number) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }));
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleClose = () => { setPreviews([]); setForm(EMPTY_FORM); onClose(); };
  const valid = form.title && form.clientName && form.deadline;
  const isEdit = !!initial;

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center sm:p-4"
      onClick={e => e.target === e.currentTarget && handleClose()}
    >
      <div className="bg-[#1a1d27] rounded-t-3xl sm:rounded-2xl border border-[#2a2d3a] w-full sm:max-w-lg p-6 pb-10 sm:pb-6 max-h-[92vh] overflow-y-auto animate-slide-up">
        {/* Drag handle (mobile only) */}
        <div className="w-8 h-1 bg-[#2a2d3a] rounded-full mx-auto mb-5 sm:hidden" />

        <h2 className="text-lg font-extrabold text-white mb-5" style={{ fontFamily: "'Syne', sans-serif" }}>
          {isEdit ? 'Buyurtmani tahrirlash' : 'Yangi buyurtma'}
        </h2>

        <div className="space-y-3.5">
          {([
            { label: 'Buyurtma nomi', key: 'title',      placeholder: 'Oshxona garnitury', type: 'text' },
            { label: 'Mijoz ismi',    key: 'clientName', placeholder: 'Sardor Rahimov',   type: 'text' },
            { label: 'Muddat',        key: 'deadline',   placeholder: '',                  type: 'date' },
          ] as const).map(({ label, key, placeholder, type }) => (
            <div key={key}>
              <label className="block text-[#888] text-[11px] uppercase tracking-widest mb-1.5">{label}</label>
              <input type={type} placeholder={placeholder} value={form[key]} onChange={set(key)} className={inputCls} />
            </div>
          ))}

          {/* Narx (ixtiyoriy) */}
          <div>
            <label className="block text-[#888] text-[11px] uppercase tracking-widest mb-1.5">Narx (so'm)</label>
            <input
              inputMode="numeric"
              placeholder="0"
              value={form.amount ? Number(form.amount).toLocaleString('uz-UZ') : ''}
              onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value.replace(/[^0-9]/g, '') }))}
              className={inputCls}
            />
            <p className="text-[10px] text-[#555] mt-1.5 leading-relaxed">
              Buyurtma <span className="text-emerald-400/80">“Tugallandi”</span> bo'lganda bu summa avtomatik Hisobotlar daromadiga yoziladi.
            </p>
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-[#888] text-[11px] uppercase tracking-widest mb-1.5">Rasmlar</label>
            <label className="flex items-center justify-center gap-2 bg-[#0f1117] border-2 border-dashed border-[#2a2d3a] rounded-xl py-5 cursor-pointer text-[#555] text-sm hover:border-[#f0c040]/40 hover:text-[#888] transition">
              {uploading ? (
                <><span className="w-4 h-4 rounded-full border-2 border-[#f0c040] border-t-transparent animate-spin" /> Yuklanmoqda...</>
              ) : <>📸 Rasm qo'shish</>}
              <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
            </label>
            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {previews.map((url, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden aspect-square">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-white text-xs flex items-center justify-center hover:bg-black transition"
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <button onClick={handleClose} className="py-3 rounded-xl border border-[#2a2d3a] text-[#888] text-sm font-medium hover:bg-[#2a2d3a] transition">
            Bekor qilish
          </button>
          <button
            onClick={() => valid && onSubmit(form)}
            disabled={!valid || saving || uploading}
            className="py-3 rounded-xl bg-[#f0c040] text-[#0f1117] text-sm font-bold hover:bg-[#d4a832] disabled:opacity-40 disabled:cursor-not-allowed transition"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Image Modal ──────────────────────────────────────────────────────────────
function ImageModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const [active, setActive] = useState(0);
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div
        className="bg-[#1a1d27] rounded-t-3xl sm:rounded-2xl border border-[#2a2d3a] w-full sm:max-w-lg p-5 pb-8 sm:pb-5"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-8 h-1 bg-[#2a2d3a] rounded-full mx-auto mb-4 sm:hidden" />

        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white truncate pr-4" style={{ fontFamily: "'Syne', sans-serif" }}>
              {order.title}
            </h3>
            <p className="text-xs text-[#555] mt-0.5">{order.images.length} ta rasm</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#2a2d3a] text-[#888] flex items-center justify-center hover:text-white transition text-sm shrink-0"
          >✕</button>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={order.images[active]} alt="" className="w-full rounded-xl object-cover aspect-video mb-3" />

        {order.images.length > 1 && (
          <div className="grid grid-cols-5 gap-2">
            {order.images.map((url, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`rounded-lg overflow-hidden aspect-square border-2 transition ${
                  i === active ? 'border-[#f0c040]' : 'border-transparent opacity-50 hover:opacity-80'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const [orders, setOrders]               = useState<Order[]>([]);
  const [loading, setLoading]             = useState(true);
  const [showModal, setShowModal]         = useState(false);
  const [editingOrder, setEditingOrder]   = useState<Order | null>(null);
  const [saving, setSaving]               = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [toast, setToast]                 = useState<string | null>(null);
  const [filter, setFilter]               = useState<'all' | Order['status']>('all');
  const [company, setCompany]             = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const fetchOrders = async () => {
    const res = await fetch('/api/orders');
    setOrders(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    fetch('/api/me').then((r) => (r.ok ? r.json() : null)).then((d) => { if (d?.companyName) setCompany(d.companyName); }).catch(() => {});
  }, []);

  const handleSubmit = async (form: FormState) => {
    setSaving(true);
    const payload = { ...form, amount: form.amount ? Number(form.amount) : 0 };
    if (editingOrder) {
      await fetch(`/api/orders/${editingOrder._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } else {
      await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    }
    setSaving(false);
    setShowModal(false);
    const wasEdit = !!editingOrder;
    setEditingOrder(null);
    showToast(wasEdit ? 'Buyurtma yangilandi ✓' : 'Buyurtma yaratildi ✓');
    fetchOrders();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Buyurtmani o'chirmoqchimisiz?")) return;
    await fetch(`/api/orders/${id}`, { method: 'DELETE' });
    showToast("Buyurtma o'chirildi");
    fetchOrders();
  };

  const handleStatusChange = async (id: string, status: Order['status']) => {
    // optimistik yangilanish
    setOrders(prev => prev.map(o => (o._id === id ? { ...o, status } : o)));
    await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    showToast('Status yangilandi ✓');
  };

  const stats = {
    total:       orders.length,
    new:         orders.filter(o => o.status === 'new').length,
    in_progress: orders.filter(o => o.status === 'in_progress').length,
    completed:   orders.filter(o => o.status === 'completed').length,
  };

  const completedRevenue = orders.filter(o => o.status === 'completed').reduce((s, o) => s + (o.amount || 0), 0);

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

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
      {(showModal || editingOrder) && (
        <OrderModal
          initial={editingOrder}
          onClose={() => { setShowModal(false); setEditingOrder(null); }}
          onSubmit={handleSubmit}
          saving={saving}
        />
      )}
      {selectedOrder && <ImageModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}

      <div className="min-h-screen bg-[#0f1117] text-[#e8e8e8]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

          {/* ── Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 sm:mb-10">
            <div>
              <p className="text-[#f0c040] text-[11px] uppercase tracking-[2px] mb-1">{company || 'Tabel'}</p>
              <h1
                className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-br from-white to-[#888] bg-clip-text text-transparent m-0"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                Buyurtmalar
              </h1>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="self-start sm:self-auto bg-[#f0c040] text-[#0f1117] text-sm font-bold px-5 py-3 rounded-xl hover:bg-[#d4a832] active:scale-95 transition whitespace-nowrap"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              + Buyurtma qo'shish
            </button>
          </div>

          {/* ── Stats ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 sm:mb-8">
            <StatCard label="Jami"       value={stats.total}       color="text-white"       icon="📦" chip="bg-[#22252f]" active={filter==='all'}         onClick={() => setFilter('all')} />
            <StatCard label="Yangi"      value={stats.new}         color="text-blue-400"    icon="🆕" chip="bg-[#15233a]" active={filter==='new'}         onClick={() => setFilter('new')} />
            <StatCard label="Jarayonda"  value={stats.in_progress} color="text-amber-400"   icon="⏳" chip="bg-[#2a2410]" active={filter==='in_progress'} onClick={() => setFilter('in_progress')} />
            <StatCard label="Tugallandi" value={stats.completed}   color="text-emerald-400" icon="✅" chip="bg-[#142614]" active={filter==='completed'}   onClick={() => setFilter('completed')} />
          </div>

          {/* ── Tugallangan daromad ── */}
          {completedRevenue > 0 && (
            <div className="mb-6 sm:mb-8 flex items-center gap-3 bg-[#101a12] border border-emerald-900/40 rounded-2xl px-4 py-3">
              <span className="w-9 h-9 rounded-xl bg-[#142614] text-emerald-400 flex items-center justify-center text-base shrink-0">💰</span>
              <div className="min-w-0">
                <p className="text-[10px] text-[#666] uppercase tracking-widest m-0">Tugallangan buyurtmalar daromadi</p>
                <p className="text-lg sm:text-xl font-extrabold text-emerald-400 m-0 whitespace-nowrap" style={{ fontFamily: "'Syne', sans-serif" }}>{fmtMoney(completedRevenue)} so'm</p>
              </div>
              <span className="ml-auto text-[10px] text-[#555] hidden sm:block text-right">Hisobotlar bo'limiga<br />avtomatik yoziladi</span>
            </div>
          )}

          {/* ── Content ── */}
          {loading ? (
            <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] py-16 flex flex-col items-center gap-3 text-[#555]">
              <div className="w-8 h-8 rounded-full border-2 border-[#f0c040] border-t-transparent animate-spin" />
              <p className="text-sm">Yuklanmoqda...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] py-20 text-center text-[#555]">
              <p className="text-5xl mb-4">📦</p>
              <p className="text-sm">Hali buyurtma qo'shilmagan</p>
              <button onClick={() => setShowModal(true)} className="mt-4 text-sm text-[#f0c040] underline underline-offset-2">
                Birinchi buyurtmani qo'shish
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] py-16 text-center text-[#555]">
              <p className="text-sm m-0">Bu holatda buyurtma yo&apos;q</p>
            </div>
          ) : (
            <>
              {/* ── Mobile cards (< sm) ── */}
              <div className="sm:hidden space-y-3">
                {filtered.map(order => (
                  <OrderCard
                    key={order._id}
                    order={order}
                    onDelete={() => handleDelete(order._id)}
                    onEdit={() => setEditingOrder(order)}
                    onImages={() => setSelectedOrder(order)}
                    onStatusChange={(s) => handleStatusChange(order._id, s)}
                  />
                ))}
              </div>

              {/* ── Desktop / tablet rows (sm+) ── */}
              <div className="hidden sm:flex flex-col gap-3">
                {filtered.map(order => {
                  const overdue = isOverdue(order);
                  return (
                    <div
                      key={order._id}
                      className={`bg-[#1a1d27] rounded-2xl border px-4 sm:px-5 py-4 flex items-center gap-3 sm:gap-4 hover:bg-[#1f2235] transition ${
                        overdue ? 'border-red-900/50' : 'border-[#2a2d3a]'
                      }`}
                    >
                      {/* Icon */}
                      <div className="w-10 sm:w-11 h-10 sm:h-11 rounded-xl bg-[#14161f] flex items-center justify-center text-xl shrink-0">
                        📦
                      </div>

                      {/* Title + client */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm sm:text-[15px] text-white truncate">{order.title}</p>
                        <p className="text-[#666] text-xs mt-0.5 truncate">👤 {order.clientName}</p>
                      </div>

                      {/* Images — hidden on sm, shown md+ */}
                      {order.images?.length > 0 && (
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="shrink-0 hidden md:block text-xs px-3 py-1.5 rounded-lg bg-blue-950 border border-blue-800/30 text-blue-400 font-semibold hover:bg-blue-900 transition"
                        >
                          🖼 {order.images.length} ta rasm
                        </button>
                      )}

                      {/* Deadline — hidden on sm */}
                      <div className="shrink-0 text-right hidden lg:block">
                        <p className="text-[#555] text-[10px] uppercase tracking-wide mb-0.5">Muddat</p>
                        <p className={`text-xs font-medium ${overdue ? 'text-red-400' : 'text-[#888]'}`}>
                          {overdue ? '⚠ ' : ''}{fmtDate(order.deadline)}
                        </p>
                      </div>

                      {/* Narx */}
                      <div className="shrink-0 text-right hidden sm:block min-w-[88px]">
                        <p className="text-[#555] text-[10px] uppercase tracking-wide mb-0.5">Narx</p>
                        <p className={`text-xs font-semibold ${order.amount > 0 ? (order.status === 'completed' ? 'text-emerald-400' : 'text-[#e8e8e8]') : 'text-[#555]'}`}>
                          {order.amount > 0 ? fmtMoney(order.amount) : '—'}
                        </p>
                      </div>

                      {/* Status dropdown */}
                      <StatusSelect value={order.status} onChange={(s) => handleStatusChange(order._id, s)} />

                      {/* Edit */}
                      <button
                        onClick={() => setEditingOrder(order)}
                        title="Tahrirlash"
                        className="shrink-0 text-xs px-2.5 py-1.5 rounded-lg border border-[#2a2d3a] text-[#aaa] hover:bg-[#2a2d3a] transition"
                      >
                        ✏
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(order._id)}
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