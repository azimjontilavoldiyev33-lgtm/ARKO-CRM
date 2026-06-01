'use client';

import { useEffect, useState } from 'react';

interface Worker {
  _id: string;
  fullName: string;
  position?: string;
  salary?: number;
}

interface SalaryResult {
  workDays: number;
  totalWorkDays: number;
  overtimeHours: number;
  hourlyRate: number;
  dailyRate: number;
  overtimePay: number;
  baseSalary: number;
  totalSalary: number;
}

const inputCls = 'w-full bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-4 py-3 text-sm text-[#e8e8e8] outline-none focus:border-[#f0c040] transition placeholder-[#444] [color-scheme:dark]';

function fmt(n: number) {
  return n.toLocaleString('uz-UZ') + ' so\'m';
}

export default function SalaryPage() {
  const [workers, setWorkers]   = useState<Worker[]>([]);
  const [workerId, setWorkerId] = useState('');
  const [month, setMonth]       = useState(new Date().getMonth() + 1);
  const [year, setYear]         = useState(new Date().getFullYear());
  const [salary, setSalary]     = useState('');
  const [result, setResult]     = useState<SalaryResult | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

useEffect(() => {
  const worker = workers.find(w => w._id === workerId);
  if (worker?.salary) setSalary(worker.salary.toString());
  else setSalary('');
}, [workerId, workers]);

  async function calculate() {
    if (!workerId || !salary) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(
        `/api/salary?workerId=${workerId}&month=${month}&year=${year}&salary=${salary}`
      );
      const data = await res.json();
      if (data.error) setError(data.error);
      else setResult(data);
    } catch {
      setError('Xato yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  const months = [
    'Yanvar','Fevral','Mart','Aprel','May','Iyun',
    'Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'
  ];

  return (
    <div className="min-h-screen bg-[#0f1117] text-[#e8e8e8]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');`}</style>

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <p className="text-[#555] text-[11px] uppercase tracking-[2px] mb-1">Mebel CRM</p>
          <h1 className="text-3xl font-extrabold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
            Oylik hisob
          </h1>
        </div>

        {/* Form */}
        <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] p-6 space-y-4 mb-6">

          {/* Ishchi */}
          <div>
            <label className="block text-[#888] text-[11px] uppercase tracking-widest mb-1.5">Ishchi</label>
            <select value={workerId} onChange={e => setWorkerId(e.target.value)} className={inputCls}>
              <option value="">Ishchi tanlang</option>
              {workers.map(w => (
                <option key={w._id} value={w._id}>{w.fullName}</option>
              ))}
            </select>
          </div>

          {/* Oy va yil */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#888] text-[11px] uppercase tracking-widest mb-1.5">Oy</label>
              <select value={month} onChange={e => setMonth(+e.target.value)} className={inputCls}>
                {months.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[#888] text-[11px] uppercase tracking-widest mb-1.5">Yil</label>
              <select value={year} onChange={e => setYear(+e.target.value)} className={inputCls}>
                {[2024, 2025, 2026].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Oylik maosh */}
          <div>
            <label className="block text-[#888] text-[11px] uppercase tracking-widest mb-1.5">Oylik maosh (so'm)</label>
            <input
              type="number"
              placeholder="6000000"
              value={salary}
              onChange={e => setSalary(e.target.value)}
              className={inputCls}
            />
          </div>

          <button
            onClick={calculate}
            disabled={!workerId || !salary || loading}
            className="w-full py-3 rounded-xl bg-[#f0c040] text-[#0f1117] font-bold text-sm hover:bg-[#d4a832] disabled:opacity-40 disabled:cursor-not-allowed transition"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            {loading ? 'Hisoblanmoqda...' : 'Hisoblash'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-950/50 border border-red-800/40 rounded-2xl p-4 text-red-400 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] p-6 space-y-4">
            <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
              {months[month - 1]} {year} — Hisob
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#14161f] rounded-xl p-4">
                <p className="text-[#555] text-[10px] uppercase tracking-wide mb-1">Ish kunlari</p>
                <p className="text-2xl font-bold text-white">{result.workDays}<span className="text-sm text-[#555] ml-1">/ {result.totalWorkDays}</span></p>
              </div>
              <div className="bg-[#14161f] rounded-xl p-4">
                <p className="text-[#555] text-[10px] uppercase tracking-wide mb-1">Overtime</p>
                <p className="text-2xl font-bold text-amber-400">{result.overtimeHours}<span className="text-sm text-[#555] ml-1">soat</span></p>
              </div>
              <div className="bg-[#14161f] rounded-xl p-4">
                <p className="text-[#555] text-[10px] uppercase tracking-wide mb-1">Soatlik</p>
                <p className="text-lg font-bold text-blue-400">{fmt(result.hourlyRate)}</p>
              </div>
              <div className="bg-[#14161f] rounded-xl p-4">
                <p className="text-[#555] text-[10px] uppercase tracking-wide mb-1">Kunlik</p>
                <p className="text-lg font-bold text-blue-400">{fmt(result.dailyRate)}</p>
              </div>
            </div>

            <div className="border-t border-[#2a2d3a] pt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[#888] text-sm">Asosiy maosh</span>
                <span className="text-white font-semibold">{fmt(result.baseSalary)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#888] text-sm">Overtime to'lovi</span>
                <span className="text-amber-400 font-semibold">+ {fmt(result.overtimePay)}</span>
              </div>
              <div className="flex justify-between items-center border-t border-[#2a2d3a] pt-3">
                <span className="text-white font-bold">Jami</span>
                <span className="text-emerald-400 text-xl font-extrabold">{fmt(result.totalSalary)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}