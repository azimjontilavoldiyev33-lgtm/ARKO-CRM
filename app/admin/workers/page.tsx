'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Worker {
  _id: string;
  fullName: string;
  phoneNumber: string;
  code?: string;
  position?: string;
  createdAt: string;
  salary?: number;
}

const AVATAR_COLORS = [
  { bg: 'bg-[#1a2a3a]', text: 'text-[#60a5fa]' },
  { bg: 'bg-[#2a1a2a]', text: 'text-[#c084fc]' },
  { bg: 'bg-[#142614]', text: 'text-[#4ade80]' },
  { bg: 'bg-[#2a2410]', text: 'text-[#f0c040]' },
  { bg: 'bg-[#2a1414]', text: 'text-[#f87171]' },
  { bg: 'bg-[#141a26]', text: 'text-[#818cf8]' },
];

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [query, setQuery] = useState('');
  const [company, setCompany] = useState('');
const [form, setForm] = useState({ fullName: '', phoneNumber: '', position: '', salary: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchWorkers = async () => {
    setLoading(true);
    const res = await fetch('/api/workers');
    const data = await res.json();
    setWorkers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchWorkers();
    fetch('/api/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.companyName) setCompany(d.companyName); })
      .catch(() => {});
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? workers.filter((w) =>
        w.fullName.toLowerCase().includes(q) ||
        w.phoneNumber.includes(q) ||
        (w.position || '').toLowerCase().includes(q) ||
        (w.code || '').includes(q)
      )
    : workers;

  const handleSubmit = async () => {
    if (!form.fullName || !form.phoneNumber) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          salary: form.salary ? +form.salary : 0,
          phoneNumber: form.phoneNumber.replace('+', '').replace(/\s/g, ''),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Saqlashda xatolik yuz berdi");
        return;
      }
      setForm({ fullName: '', phoneNumber: '', position: '', salary: '' });
      setShowModal(false);
      fetchWorkers();
    } catch {
      setError('Tarmoq xatosi — qaytadan urinib ko\'ring');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Ustani o'chirmoqchimisiz?")) return;
    await fetch(`/api/workers/${id}`, { method: 'DELETE' });
    fetchWorkers();
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-[#e8e8e8] font-sans p-4 sm:p-6 lg:p-8">
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap"
        rel="stylesheet"
      />

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8 sm:mb-10">
        <div>
          <p className="text-[#f0c040] text-[11px] tracking-[2px] uppercase mb-1.5">{company || 'Tabel'}</p>
          <h1
            className="text-3xl sm:text-4xl font-extrabold m-0 bg-gradient-to-br from-white to-[#888] bg-clip-text text-transparent"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Ustalar
          </h1>
        </div>
        <button
          onClick={() => { setError(''); setShowModal(true); }}
          className="self-start sm:self-auto bg-[#f0c040] text-[#0f1117] border-none rounded-xl px-5 py-3 font-bold text-sm cursor-pointer tracking-wide hover:bg-[#f5d060] transition-colors"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          + Usta qo'shish
        </button>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-7 sm:mb-8">
        {[
          { label: 'Jami ustalar',      value: workers.length,                                  color: 'text-[#f0c040]', icon: '👷', chip: 'bg-[#2a2410]' },
          { label: 'Lavozimli',         value: workers.filter(w => w.position).length,          color: 'text-[#4ade80]', icon: '🏷️', chip: 'bg-[#142614]' },
          { label: 'Oylik belgilangan', value: workers.filter(w => (w.salary ?? 0) > 0).length, color: 'text-[#60a5fa]', icon: '💰', chip: 'bg-[#15233a]' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#1a1d27] rounded-2xl px-5 py-4 sm:py-5 border border-[#2a2d3a]">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[#666] text-[11px] tracking-[1.5px] uppercase m-0">{stat.label}</p>
              <span className={`w-8 h-8 rounded-lg ${stat.chip} ${stat.color} flex items-center justify-center text-sm shrink-0`}>{stat.icon}</span>
            </div>
            <p
              className={`text-3xl sm:text-4xl font-extrabold m-0 ${stat.color}`}
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Table card ─────────────────────────────────────── */}
      <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] overflow-hidden">
        {/* Table header row + qidiruv */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 px-5 sm:px-6 py-4 border-b border-[#2a2d3a]">
          <p className="m-0 font-semibold text-[15px]">Barcha ustalar <span className="text-[#555] font-normal">· {filtered.length}</span></p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555] text-sm pointer-events-none">🔍</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Qidirish (ism, telefon, kod)..."
              className="w-full sm:w-72 bg-[#0f1117] border border-[#2a2d3a] rounded-lg pl-9 pr-3 py-2 text-sm text-[#e8e8e8] outline-none focus:border-[#f0c040] transition-colors placeholder:text-[#444]"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-[#555]">Yuklanmoqda...</div>
        ) : workers.length === 0 ? (
          <div className="py-16 text-center text-[#555]">
            <p className="text-5xl m-0 mb-3">👷</p>
            <p className="m-0">Hali usta qo'shilmagan</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-[#555]">
            <p className="text-4xl m-0 mb-3">🔍</p>
            <p className="m-0">&quot;{query}&quot; bo&apos;yicha topilmadi</p>
          </div>
        ) : (
          <>
            {/* ── Desktop table (md+) ─── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#14161f]">
                    {["Ism", "Telefon", "Lavozim", "Kod", "Qo'shilgan", ""].map((h, i) => (
                      <th
                        key={i}
                        className="px-6 py-3 text-left text-[#555] text-[11px] tracking-widest uppercase font-medium"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((worker, i) => {
                    const av = AVATAR_COLORS[i % AVATAR_COLORS.length];
                    return (
                      <tr
                        key={worker._id}
                        className="border-t border-[#2a2d3a] hover:bg-[#1f2235] transition-colors"
                      >
                        {/* Name + avatar */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${av.bg} ${av.text}`}>
                              {worker.fullName[0]}
                            </div>
                            <span className="font-medium text-sm">{worker.fullName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[#888] font-mono text-sm">+{worker.phoneNumber}</td>
                        <td className="px-6 py-4 text-[#888] text-sm">{worker.position || '—'}</td>
                        <td className="px-6 py-4">
                          <span className="bg-[#1a2333] text-[#9aabbf] rounded-md px-2.5 py-1 text-xs font-mono font-semibold tracking-widest">
                            #{worker.code ?? '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[#555] text-sm">
                          {new Date(worker.createdAt).toLocaleDateString('uz-UZ')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Link
                              href={`/admin/workers/${worker._id}`}
                              className="bg-[#1a2a3a] text-[#60a5fa] rounded-lg px-3 py-1.5 text-xs no-underline hover:bg-[#223344] transition-colors"
                            >
                              Profil →
                            </Link>
                            <button
                              onClick={() => handleDelete(worker._id)}
                              className="bg-transparent border border-[#3a1a1a] text-[#f87171] rounded-lg px-3 py-1.5 text-xs cursor-pointer hover:bg-[#2a1414] transition-colors"
                            >
                              O'chirish
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Mobile cards (< md) ─── */}
            <div className="md:hidden divide-y divide-[#2a2d3a]">
              {filtered.map((worker, i) => {
                const av = AVATAR_COLORS[i % AVATAR_COLORS.length];
                return (
                  <div key={worker._id} className="px-4 py-4 flex flex-col gap-3">
                    {/* Top row: avatar + name + telegram badge */}
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold shrink-0 ${av.bg} ${av.text}`}>
                        {worker.fullName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="m-0 font-medium text-sm leading-tight">{worker.fullName}</p>
                        <p className="m-0 text-[#666] text-xs mt-0.5">{worker.position || '—'}</p>
                      </div>
                      <span className="shrink-0 bg-[#1a2333] text-[#9aabbf] rounded-md px-2.5 py-1 text-xs font-mono font-semibold tracking-widest">
                        #{worker.code ?? '—'}
                      </span>
                    </div>

                    {/* Details row */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#666]">
                      <span className="font-mono">+{worker.phoneNumber}</span>
                      <span>📅 {new Date(worker.createdAt).toLocaleDateString('uz-UZ')}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/workers/${worker._id}`}
                        className="flex-1 text-center bg-[#1a2a3a] text-[#60a5fa] rounded-lg py-2 text-xs no-underline hover:bg-[#223344] transition-colors"
                      >
                        Profil →
                      </Link>
                      <button
                        onClick={() => handleDelete(worker._id)}
                        className="flex-1 bg-transparent border border-[#3a1a1a] text-[#f87171] rounded-lg py-2 text-xs cursor-pointer hover:bg-[#2a1414] transition-colors"
                      >
                        O'chirish
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Modal ──────────────────────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="bg-[#1a1d27] rounded-t-3xl sm:rounded-2xl p-6 sm:p-8 w-full sm:max-w-md border border-[#2a2d3a]">
            <h2
              className="text-xl sm:text-2xl font-extrabold m-0 mb-6"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Yangi usta
            </h2>

            <div className="flex flex-col gap-4">
              {[
                { label: 'Ism familiya', key: 'fullName',     placeholder: 'Azim Karimov',       type: 'text' },
                { label: 'Telefon',      key: 'phoneNumber',  placeholder: '+998 97 460 15 20',  type: 'text' },
                { label: 'Lavozim',      key: 'position',     placeholder: 'Duradgor',            type: 'text' },
                { label: 'Oylik maosh (so\'m)', key: 'salary', placeholder: '6000000', type: 'number' },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-[#888] text-[11px] tracking-[1px] uppercase mb-2">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={form[field.key as keyof typeof form]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-4 py-3 text-[#e8e8e8] text-sm outline-none focus:border-[#f0c040] transition-colors placeholder:text-[#333]"
                  />
                </div>
              ))}
            </div>

            {error && (
              <p className="text-red-400 text-sm mt-4 bg-red-950/40 border border-red-900/40 rounded-xl px-4 py-2.5">
                {error}
              </p>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setError(''); setShowModal(false); }}
                className="flex-1 bg-transparent border border-[#2a2d3a] text-[#888] rounded-xl py-3 cursor-pointer text-sm hover:border-[#3a3d4a] hover:text-[#aaa] transition-colors"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 bg-[#f0c040] text-[#0f1117] border-none rounded-xl py-3 font-bold text-sm cursor-pointer hover:bg-[#f5d060] disabled:opacity-60 transition-colors"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                {saving ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}