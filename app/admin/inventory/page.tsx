'use client';

import { useEffect, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Material {
  _id: string;
  name: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  price: number;
  createdAt: string;
}
interface Movement {
  _id: string;
  type: 'in' | 'out';
  quantity: number;
  note: string;
  date: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtMoney = (n: number) => Math.round(n).toLocaleString('uz-UZ');
const fmtQty = (n: number) => Number(n).toLocaleString('uz-UZ', { maximumFractionDigits: 2 });
const fmtDate = (d: string) => new Date(d).toLocaleDateString('uz-UZ');
const isLow = (m: Material) => m.minQuantity > 0 && m.quantity <= m.minQuantity;
const UNITS = ['dona', 'm', 'm²', 'kg', 'litr', 'list', 'rulon', 'komplekt'];

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
function StatCard({ label, value, color, icon, chip, suffix }: { label: string; value: string; color: string; icon: string; chip: string; suffix?: string }) {
  return (
    <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] p-4 sm:p-5">
      <div className="flex justify-between items-start mb-2">
        <p className="text-[#666] text-[10px] sm:text-[11px] uppercase tracking-widest m-0">{label}</p>
        <span className={`w-8 h-8 rounded-lg ${chip} ${color} flex items-center justify-center text-sm shrink-0`}>{icon}</span>
      </div>
      <p className={`text-xl sm:text-2xl font-extrabold ${color} whitespace-nowrap`} style={{ fontFamily: "'Syne', sans-serif" }}>
        {value}{suffix && <span className="text-sm font-semibold text-[#666] ml-1">{suffix}</span>}
      </p>
    </div>
  );
}

// ─── Add / Edit Material Modal ──────────────────────────────────────────────────
type MatForm = { name: string; unit: string; quantity: string; minQuantity: string; price: string };

function MaterialModal({ initial, onClose, onSubmit, saving }: { initial?: Material | null; onClose: () => void; onSubmit: (f: MatForm) => void; saving: boolean }) {
  const isEdit = !!initial;
  const [form, setForm] = useState<MatForm>(
    initial
      ? { name: initial.name, unit: initial.unit, quantity: '', minQuantity: initial.minQuantity ? String(initial.minQuantity) : '', price: initial.price ? String(initial.price) : '' }
      : { name: '', unit: 'dona', quantity: '', minQuantity: '', price: '' },
  );
  const set = (k: keyof MatForm, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const valid = form.name.trim().length > 0 && form.unit.trim().length > 0;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#1a1d27] rounded-t-3xl sm:rounded-2xl border border-[#2a2d3a] w-full sm:max-w-lg p-6 pb-10 sm:pb-6 max-h-[92vh] overflow-y-auto animate-slide-up">
        <div className="w-8 h-1 bg-[#2a2d3a] rounded-full mx-auto mb-5 sm:hidden" />
        <h2 className="text-lg font-extrabold text-white mb-5" style={{ fontFamily: "'Syne', sans-serif" }}>
          {isEdit ? 'Materialni tahrirlash' : 'Yangi material'}
        </h2>

        <div className="space-y-3.5">
          <div>
            <label className="block text-[#888] text-[11px] uppercase tracking-widest mb-1.5">Nomi</label>
            <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="LDSP 16mm oq" className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#888] text-[11px] uppercase tracking-widest mb-1.5">Birlik</label>
              <input list="units" value={form.unit} onChange={(e) => set('unit', e.target.value)} placeholder="dona" className={inputCls} />
              <datalist id="units">{UNITS.map((u) => <option key={u} value={u} />)}</datalist>
            </div>
            <div>
              <label className="block text-[#888] text-[11px] uppercase tracking-widest mb-1.5">Kam qolish chegarasi</label>
              <input inputMode="decimal" value={form.minQuantity} onChange={(e) => set('minQuantity', e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {!isEdit && (
              <div>
                <label className="block text-[#888] text-[11px] uppercase tracking-widest mb-1.5">Boshlang'ich qoldiq</label>
                <input inputMode="decimal" value={form.quantity} onChange={(e) => set('quantity', e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0" className={inputCls} />
              </div>
            )}
            <div className={isEdit ? 'col-span-2' : ''}>
              <label className="block text-[#888] text-[11px] uppercase tracking-widest mb-1.5">Birlik narxi (so'm)</label>
              <input inputMode="numeric" value={form.price ? Number(form.price).toLocaleString('uz-UZ') : ''} onChange={(e) => set('price', e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" className={inputCls} />
            </div>
          </div>
          {isEdit && <p className="text-[10px] text-[#555]">Qoldiqni o'zgartirish uchun Kirim/Chiqim ishlating.</p>}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <button onClick={onClose} className="py-3 rounded-xl border border-[#2a2d3a] text-[#888] text-sm font-medium hover:bg-[#2a2d3a] transition">Bekor qilish</button>
          <button
            onClick={() => valid && onSubmit(form)}
            disabled={!valid || saving}
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

// ─── Movement (Kirim / Chiqim) Modal ────────────────────────────────────────────
function MovementModal({ material, presetType, onClose, onSubmit, saving }: { material: Material; presetType: 'in' | 'out'; onClose: () => void; onSubmit: (b: { type: 'in' | 'out'; quantity: number; note: string; expenseAmount?: number }) => void; saving: boolean }) {
  const [type, setType] = useState<'in' | 'out'>(presetType);
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [recordExpense, setRecordExpense] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');

  const qty = Number(quantity);
  const valid = qty > 0 && (type === 'in' || qty <= material.quantity);
  const suggested = qty > 0 && material.price > 0 ? Math.round(qty * material.price) : 0;
  const effExpense = expenseAmount ? Number(expenseAmount) : suggested;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#1a1d27] rounded-t-3xl sm:rounded-2xl border border-[#2a2d3a] w-full sm:max-w-md p-6 pb-10 sm:pb-6 animate-slide-up">
        <div className="w-8 h-1 bg-[#2a2d3a] rounded-full mx-auto mb-5 sm:hidden" />
        <h2 className="text-lg font-extrabold text-white mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>{material.name}</h2>
        <p className="text-xs text-[#666] mb-5">Joriy qoldiq: <span className="text-[#e8e8e8] font-semibold">{fmtQty(material.quantity)} {material.unit}</span></p>

        {/* Type toggle */}
        <div className="flex rounded-xl overflow-hidden border border-[#2a2d3a] mb-4">
          <button onClick={() => setType('in')} className={`flex-1 py-2.5 text-sm font-semibold transition ${type === 'in' ? 'bg-emerald-500 text-[#0f1117]' : 'bg-[#0f1117] text-[#888]'}`}>+ Kirim</button>
          <button onClick={() => setType('out')} className={`flex-1 py-2.5 text-sm font-semibold transition ${type === 'out' ? 'bg-red-500 text-white' : 'bg-[#0f1117] text-[#888]'}`}>− Chiqim</button>
        </div>

        <div className="space-y-3.5">
          <div>
            <label className="block text-[#888] text-[11px] uppercase tracking-widest mb-1.5">Miqdor ({material.unit})</label>
            <input autoFocus inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0" className={inputCls} />
            {type === 'out' && qty > material.quantity && <p className="text-[11px] text-red-400 mt-1">Qoldiq yetarli emas (mavjud: {fmtQty(material.quantity)})</p>}
          </div>
          <div>
            <label className="block text-[#888] text-[11px] uppercase tracking-widest mb-1.5">Izoh (ixtiyoriy)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={type === 'in' ? 'Yangi xarid' : 'Buyurtmaga sarflandi'} className={inputCls} />
          </div>

          {type === 'in' && (
            <div className="bg-[#0f1117] border border-[#2a2d3a] rounded-xl p-3">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={recordExpense} onChange={(e) => setRecordExpense(e.target.checked)} className="w-4 h-4 accent-[#f0c040]" />
                <span className="text-sm text-[#e8e8e8]">Hisobotlar xarajatiga yozilsin</span>
              </label>
              {recordExpense && (
                <div className="mt-3">
                  <input
                    inputMode="numeric"
                    value={expenseAmount ? Number(expenseAmount).toLocaleString('uz-UZ') : (suggested ? suggested.toLocaleString('uz-UZ') : '')}
                    onChange={(e) => setExpenseAmount(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Xarajat summasi (so'm)"
                    className={inputCls}
                  />
                  <p className="text-[10px] text-[#555] mt-1.5">{suggested > 0 ? `Taklif: ${fmtMoney(suggested)} so'm (miqdor × narx) — o'zgartirsa bo'ladi` : "Material narxi 0 — summani qo'lda kiriting"}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <button onClick={onClose} className="py-3 rounded-xl border border-[#2a2d3a] text-[#888] text-sm font-medium hover:bg-[#2a2d3a] transition">Bekor qilish</button>
          <button
            onClick={() => valid && onSubmit({ type, quantity: qty, note, expenseAmount: type === 'in' && recordExpense ? effExpense : 0 })}
            disabled={!valid || saving}
            className={`py-3 rounded-xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed transition ${type === 'in' ? 'bg-emerald-500 text-[#0f1117] hover:bg-emerald-400' : 'bg-red-500 text-white hover:bg-red-400'}`}
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            {saving ? '...' : type === 'in' ? 'Kirim qilish' : 'Chiqim qilish'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── History Modal ──────────────────────────────────────────────────────────────
function HistoryModal({ material, movements, loading, onClose }: { material: Material; movements: Movement[]; loading: boolean; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#1a1d27] rounded-t-3xl sm:rounded-2xl border border-[#2a2d3a] w-full sm:max-w-md p-6 pb-10 sm:pb-6 max-h-[80vh] flex flex-col animate-slide-up">
        <div className="w-8 h-1 bg-[#2a2d3a] rounded-full mx-auto mb-5 sm:hidden" />
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-extrabold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>{material.name}</h2>
            <p className="text-xs text-[#666] mt-0.5">Harakatlar tarixi</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-[#2a2d3a] text-[#888] flex items-center justify-center hover:text-white transition text-sm shrink-0">✕</button>
        </div>
        <div className="overflow-y-auto -mx-1 px-1">
          {loading ? (
            <p className="text-center text-[#555] text-sm py-8">Yuklanmoqda...</p>
          ) : movements.length === 0 ? (
            <p className="text-center text-[#555] text-sm py-8">Harakatlar yo'q</p>
          ) : (
            <div className="divide-y divide-[#23262f]">
              {movements.map((m) => (
                <div key={m._id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${m.type === 'in' ? 'bg-[#142614] text-emerald-400' : 'bg-[#2a1414] text-red-400'}`}>{m.type === 'in' ? '↓' : '↑'}</span>
                    <div className="min-w-0">
                      <p className="m-0 text-sm font-medium">{m.type === 'in' ? 'Kirim' : 'Chiqim'}{m.note && <span className="text-[#666] font-normal"> · {m.note}</span>}</p>
                      <p className="m-0 text-[11px] text-[#555]">{fmtDate(m.date)}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold whitespace-nowrap ${m.type === 'in' ? 'text-emerald-400' : 'text-red-400'}`}>{m.type === 'in' ? '+' : '−'}{fmtQty(m.quantity)} {material.unit}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Action buttons (shared) ────────────────────────────────────────────────────
function RowActions({ onIn, onOut, onHistory, onEdit, onDelete, compact }: { onIn: () => void; onOut: () => void; onHistory: () => void; onEdit: () => void; onDelete: () => void; compact?: boolean }) {
  const base = 'shrink-0 rounded-lg font-semibold transition border';
  const sz = compact ? 'text-xs px-2.5 py-1.5' : 'text-xs px-3 py-2';
  return (
    <>
      <button onClick={onIn} className={`${base} ${sz} border-emerald-900/40 text-emerald-400 hover:bg-emerald-950/40`}>+ Kirim</button>
      <button onClick={onOut} className={`${base} ${sz} border-red-900/40 text-red-400 hover:bg-red-950/40`}>− Chiqim</button>
      <button onClick={onHistory} title="Tarix" className={`${base} ${sz} border-[#2a2d3a] text-[#888] hover:bg-[#2a2d3a]`}>🕘</button>
      <button onClick={onEdit} title="Tahrirlash" className={`${base} ${sz} border-[#2a2d3a] text-[#aaa] hover:bg-[#2a2d3a]`}>✏</button>
      <button onClick={onDelete} title="O'chirish" className={`${base} ${sz} border-red-900/40 text-red-400 hover:bg-red-950/40`}>🗑</button>
    </>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function InventoryPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [onlyLow, setOnlyLow] = useState(false);

  const [matModal, setMatModal] = useState<{ editing: Material | null } | null>(null);
  const [moveModal, setMoveModal] = useState<{ material: Material; type: 'in' | 'out' } | null>(null);
  const [historyFor, setHistoryFor] = useState<Material | null>(null);
  const [history, setHistory] = useState<Movement[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const fetchMaterials = async () => {
    const res = await fetch('/api/materials');
    const data = res.ok ? await res.json() : [];
    setMaterials(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMaterials();
    fetch('/api/me').then((r) => (r.ok ? r.json() : null)).then((d) => { if (d?.companyName) setCompany(d.companyName); }).catch(() => {});
  }, []);

  const submitMaterial = async (f: MatForm) => {
    setSaving(true);
    const payload = { name: f.name, unit: f.unit, quantity: f.quantity ? Number(f.quantity) : 0, minQuantity: f.minQuantity ? Number(f.minQuantity) : 0, price: f.price ? Number(f.price) : 0 };
    const editing = matModal?.editing;
    if (editing) {
      await fetch(`/api/materials/${editing._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } else {
      await fetch('/api/materials', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    }
    setSaving(false);
    setMatModal(null);
    showToast(editing ? 'Material yangilandi ✓' : 'Material qo\'shildi ✓');
    fetchMaterials();
  };

  const submitMovement = async (b: { type: 'in' | 'out'; quantity: number; note: string; expenseAmount?: number }) => {
    if (!moveModal) return;
    setSaving(true);
    const res = await fetch(`/api/materials/${moveModal.material._id}/movements`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) });
    setSaving(false);
    if (!res.ok) { const e = await res.json().catch(() => ({})); showToast(e.error || 'Xato'); return; }
    setMoveModal(null);
    showToast(b.type === 'in' ? 'Kirim qilindi ✓' : 'Chiqim qilindi ✓');
    fetchMaterials();
  };

  const deleteMaterial = async (m: Material) => {
    if (!confirm(`"${m.name}" materialini va uning butun tarixini o'chirmoqchimisiz?`)) return;
    await fetch(`/api/materials/${m._id}`, { method: 'DELETE' });
    showToast('Material o\'chirildi');
    fetchMaterials();
  };

  const openHistory = async (m: Material) => {
    setHistoryFor(m);
    setHistoryLoading(true);
    const res = await fetch(`/api/materials/${m._id}/movements`);
    setHistory(res.ok ? await res.json() : []);
    setHistoryLoading(false);
  };

  const totalValue = materials.reduce((s, m) => s + m.quantity * m.price, 0);
  const lowCount = materials.filter(isLow).length;
  const visible = onlyLow ? materials.filter(isLow) : materials;

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
      {matModal && <MaterialModal initial={matModal.editing} onClose={() => setMatModal(null)} onSubmit={submitMaterial} saving={saving} />}
      {moveModal && <MovementModal material={moveModal.material} presetType={moveModal.type} onClose={() => setMoveModal(null)} onSubmit={submitMovement} saving={saving} />}
      {historyFor && <HistoryModal material={historyFor} movements={history} loading={historyLoading} onClose={() => setHistoryFor(null)} />}

      <div className="min-h-screen bg-[#0f1117] text-[#e8e8e8]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <p className="text-[#f0c040] text-[11px] uppercase tracking-[2px] mb-1">{company || 'Tabel'}</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-br from-white to-[#888] bg-clip-text text-transparent m-0" style={{ fontFamily: "'Syne', sans-serif" }}>
                Ombor
              </h1>
            </div>
            <button
              onClick={() => setMatModal({ editing: null })}
              className="self-start sm:self-auto bg-[#f0c040] text-[#0f1117] text-sm font-bold px-5 py-3 rounded-xl hover:bg-[#d4a832] active:scale-95 transition whitespace-nowrap"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              + Material qo'shish
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6 sm:mb-8">
            <StatCard label="Materiallar" value={String(materials.length)} color="text-white" icon="🧱" chip="bg-[#22252f]" />
            <StatCard label="Umumiy qiymat" value={fmtMoney(totalValue)} suffix="so'm" color="text-emerald-400" icon="💎" chip="bg-[#142614]" />
            <StatCard label="Kam qolgan" value={String(lowCount)} color={lowCount > 0 ? 'text-amber-400' : 'text-[#888]'} icon="⚠️" chip="bg-[#2a2410]" />
          </div>

          {/* Low filter */}
          {lowCount > 0 && (
            <button
              onClick={() => setOnlyLow((v) => !v)}
              className={`mb-5 text-xs font-semibold px-3.5 py-2 rounded-xl border transition ${onlyLow ? 'border-amber-500 bg-amber-950/30 text-amber-400' : 'border-[#2a2d3a] text-[#888] hover:border-amber-700'}`}
            >
              {onlyLow ? '✓ Faqat kam qolganlar' : `⚠️ Kam qolganlar (${lowCount})`}
            </button>
          )}

          {/* Content */}
          {loading ? (
            <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] py-16 flex flex-col items-center gap-3 text-[#555]">
              <div className="w-8 h-8 rounded-full border-2 border-[#f0c040] border-t-transparent animate-spin" />
              <p className="text-sm">Yuklanmoqda...</p>
            </div>
          ) : materials.length === 0 ? (
            <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] py-20 text-center text-[#555]">
              <p className="text-5xl mb-4">🧱</p>
              <p className="text-sm">Hali material qo'shilmagan</p>
              <button onClick={() => setMatModal({ editing: null })} className="mt-4 text-sm text-[#f0c040] underline underline-offset-2">Birinchi materialni qo'shish</button>
            </div>
          ) : visible.length === 0 ? (
            <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] py-16 text-center text-[#555]"><p className="text-sm m-0">Kam qolgan material yo'q ✓</p></div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="sm:hidden space-y-3">
                {visible.map((m) => {
                  const low = isLow(m);
                  return (
                    <div key={m._id} className={`bg-[#1a1d27] rounded-2xl border p-4 space-y-3 ${low ? 'border-amber-900/60' : 'border-[#2a2d3a]'}`}>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#14161f] flex items-center justify-center text-xl shrink-0">🧱</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white leading-snug truncate">{m.name}</p>
                          <p className="text-xs text-[#555] mt-0.5">{m.price > 0 ? `${fmtMoney(m.price)} so'm / ${m.unit}` : m.unit}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-lg font-extrabold m-0 ${low ? 'text-amber-400' : 'text-white'}`} style={{ fontFamily: "'Syne', sans-serif" }}>{fmtQty(m.quantity)}</p>
                          <p className="text-[10px] text-[#555] m-0">{m.unit}</p>
                        </div>
                      </div>
                      {low && <p className="text-[11px] text-amber-400 m-0">⚠️ Kam qoldi (chegara: {fmtQty(m.minQuantity)})</p>}
                      <div className="flex flex-wrap items-center gap-2">
                        <RowActions onIn={() => setMoveModal({ material: m, type: 'in' })} onOut={() => setMoveModal({ material: m, type: 'out' })} onHistory={() => openHistory(m)} onEdit={() => setMatModal({ editing: m })} onDelete={() => deleteMaterial(m)} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop rows */}
              <div className="hidden sm:flex flex-col gap-3">
                {visible.map((m) => {
                  const low = isLow(m);
                  return (
                    <div key={m._id} className={`bg-[#1a1d27] rounded-2xl border px-4 sm:px-5 py-4 flex items-center gap-3 sm:gap-4 hover:bg-[#1f2235] transition ${low ? 'border-amber-900/60' : 'border-[#2a2d3a]'}`}>
                      <div className="w-11 h-11 rounded-xl bg-[#14161f] flex items-center justify-center text-xl shrink-0">🧱</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[15px] text-white truncate">{m.name}{low && <span className="ml-2 text-[10px] font-semibold text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded">kam qoldi</span>}</p>
                        <p className="text-[#666] text-xs mt-0.5">{m.price > 0 ? `${fmtMoney(m.price)} so'm / ${m.unit}` : m.unit}{m.minQuantity > 0 && ` · chegara ${fmtQty(m.minQuantity)}`}</p>
                      </div>
                      <div className="shrink-0 text-right hidden lg:block min-w-[110px]">
                        <p className="text-[#555] text-[10px] uppercase tracking-wide mb-0.5">Qiymat</p>
                        <p className="text-xs font-semibold text-emerald-400">{m.price > 0 ? `${fmtMoney(m.quantity * m.price)}` : '—'}</p>
                      </div>
                      <div className="shrink-0 text-right min-w-[80px]">
                        <p className={`text-lg font-extrabold m-0 ${low ? 'text-amber-400' : 'text-white'}`} style={{ fontFamily: "'Syne', sans-serif" }}>{fmtQty(m.quantity)}</p>
                        <p className="text-[10px] text-[#555] m-0">{m.unit}</p>
                      </div>
                      <RowActions compact onIn={() => setMoveModal({ material: m, type: 'in' })} onOut={() => setMoveModal({ material: m, type: 'out' })} onHistory={() => openHistory(m)} onEdit={() => setMatModal({ editing: m })} onDelete={() => deleteMaterial(m)} />
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
