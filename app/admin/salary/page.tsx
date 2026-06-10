'use client';

import { useEffect, useState, useCallback } from 'react';

interface Row {
  _id: string;
  fullName: string;
  position: string;
  salary: number;
  workDays: number;
  overtimeHours: number;
  overtimePay: number;
  baseEarned: number;
  points: number;
  pointBonus: number;
  totalSalary: number;
}
interface Sheet {
  month: number;
  year: number;
  daysInMonth: number;
  totalWorkDays: number;
  pointValue: number;
  workers: Row[];
}

const MONTHS = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
const fmtMoney = (n: number) => n.toLocaleString('uz-UZ');

export default function SalaryPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState('');

  const isArchive = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1);

  const fetchSheet = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/salary/sheet?month=${month}&year=${year}`);
      const data = await res.json();
      if (!data.error) setSheet(data);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { fetchSheet(); }, [fetchSheet]);
  useEffect(() => {
    fetch('/api/me').then((r) => (r.ok ? r.json() : null)).then((d) => { if (d?.companyName) setCompany(d.companyName); }).catch(() => {});
  }, []);

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear((y) => y - 1); } else setMonth((m) => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear((y) => y + 1); } else setMonth((m) => m + 1); };

  const workers = sheet?.workers ?? [];
  const totalPayroll = workers.reduce((s, w) => s + w.totalSalary, 0);
  const totalOvertime = workers.reduce((s, w) => s + w.overtimeHours, 0);
  const hasPoints = (sheet?.pointValue ?? 0) > 0;
  const totalPointBonus = workers.reduce((s, w) => s + w.pointBonus, 0);

  // ── Eksport ──────────────────────────────────────────────
  const exportCSV = () => {
    const head = ['Ishchi', 'Lavozim', 'Ishlagan kun', 'Overtime (soat)', ...(hasPoints ? ['Ball', "Ball summa (so'm)"] : []), "Oylik (so'm)"];
    const rows = workers.map((w) => [w.fullName, w.position, w.workDays, w.overtimeHours, ...(hasPoints ? [w.points, w.pointBonus] : []), w.totalSalary]);
    const csv = '﻿' + [head, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `oylik-${MONTHS[month - 1]}-${year}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportPDF = () => {
    const rows = workers
      .map(
        (w) => `<tr>
          <td>${w.fullName}</td><td>${w.position}</td>
          <td style="text-align:center">${w.workDays}</td>
          <td style="text-align:center">${w.overtimeHours} h</td>
          ${hasPoints ? `<td style="text-align:center">${w.points > 0 ? '+' : ''}${w.points}${w.pointBonus ? ` (${w.pointBonus > 0 ? '+' : '−'}${fmtMoney(Math.abs(w.pointBonus))})` : ''}</td>` : ''}
          <td style="text-align:right">${fmtMoney(w.totalSalary)} so'm</td>
        </tr>`
      )
      .join('');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Oylik hisobot</title>
      <style>
        body{font-family:Arial,sans-serif;padding:24px;color:#111}
        h1{font-size:18px;margin:0 0 4px} p{color:#666;margin:0 0 16px;font-size:13px}
        table{width:100%;border-collapse:collapse;font-size:13px}
        th,td{border:1px solid #ccc;padding:8px 10px}
        th{background:#f3f3f3;text-align:left}
        tfoot td{font-weight:bold;background:#fafafa}
      </style></head><body>
      <h1>Oylik hisobot — ${MONTHS[month - 1]} ${year}</h1>
      <p>Tabel · ish kunlari (yakshanbasiz): ${sheet?.totalWorkDays ?? '—'}</p>
      <table>
        <thead><tr><th>Ishchi</th><th>Lavozim</th><th style="text-align:center">Ishlagan kun</th><th style="text-align:center">Overtime</th>${hasPoints ? '<th style="text-align:center">Ball</th>' : ''}<th style="text-align:right">Oylik</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><td colspan="${hasPoints ? 5 : 4}">JAMI</td><td style="text-align:right">${fmtMoney(totalPayroll)} so'm</td></tr></tfoot>
      </table>
      <script>window.onload=function(){window.print();}</script>
      </body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-[#e8e8e8]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');`}</style>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Header + month nav */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
          <div>
            <p className="text-[#f0c040] text-[11px] uppercase tracking-[2px] mb-1">{company || 'Tabel'}</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-br from-white to-[#888] bg-clip-text text-transparent m-0" style={{ fontFamily: "'Syne', sans-serif" }}>
              Oylik hisob
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="w-9 h-9 rounded-xl bg-[#1a1d27] border border-[#2a2d3a] text-[#888] hover:text-white transition">◀</button>
            <div className="px-4 py-2 rounded-xl bg-[#1a1d27] border border-[#2a2d3a] text-center min-w-[150px]">
              <span className="font-semibold text-sm">{MONTHS[month - 1]} {year}</span>
              {isArchive && <span className="ml-2 text-[10px] text-[#f0c040] uppercase tracking-wide">arxiv</span>}
            </div>
            <button onClick={nextMonth} className="w-9 h-9 rounded-xl bg-[#1a1d27] border border-[#2a2d3a] text-[#888] hover:text-white transition">▶</button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] p-4 sm:p-5">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[#666] text-[10px] sm:text-[11px] uppercase tracking-widest m-0">Jami oylik fond</p>
              <span className="w-8 h-8 rounded-lg bg-[#142614] text-emerald-400 flex items-center justify-center text-sm shrink-0">💰</span>
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-emerald-400 m-0 whitespace-nowrap" style={{ fontFamily: "'Syne', sans-serif" }}>{fmtMoney(totalPayroll)} so&apos;m</p>
          </div>
          <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] p-4 sm:p-5">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[#666] text-[10px] sm:text-[11px] uppercase tracking-widest m-0">Ishchilar</p>
              <span className="w-8 h-8 rounded-lg bg-[#2a2410] text-[#f0c040] flex items-center justify-center text-sm shrink-0">👷</span>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#f0c040] m-0" style={{ fontFamily: "'Syne', sans-serif" }}>{workers.length}</p>
          </div>
          <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] p-4 sm:p-5">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[#666] text-[10px] sm:text-[11px] uppercase tracking-widest m-0">Jami overtime</p>
              <span className="w-8 h-8 rounded-lg bg-[#2a1a2a] text-[#c084fc] flex items-center justify-center text-sm shrink-0">⏰</span>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#c084fc] m-0" style={{ fontFamily: "'Syne', sans-serif" }}>{totalOvertime} <span className="text-base text-[#666]">soat</span></p>
          </div>
        </div>

        {/* Export */}
        <div className="flex gap-2 mb-5 sm:justify-end">
          <button onClick={exportCSV} disabled={!workers.length} className="px-4 py-2 rounded-xl bg-[#142614] border border-emerald-800/40 text-emerald-400 text-sm font-semibold hover:bg-[#173017] disabled:opacity-40 transition">
            📥 Excel
          </button>
          <button onClick={exportPDF} disabled={!workers.length} className="px-4 py-2 rounded-xl bg-[#2a1414] border border-red-800/40 text-red-400 text-sm font-semibold hover:bg-[#331717] disabled:opacity-40 transition">
            📥 PDF
          </button>
        </div>

        {loading ? (
          <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] py-16 flex flex-col items-center gap-3 text-[#555]">
            <div className="w-8 h-8 rounded-full border-2 border-[#f0c040] border-t-transparent animate-spin" />
            <p className="text-sm">Yuklanmoqda...</p>
          </div>
        ) : workers.length === 0 ? (
          <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] py-20 text-center text-[#555]">
            <p className="text-5xl mb-3">💰</p>
            <p className="text-sm">Ishchi yo'q yoki ma'lumot topilmadi</p>
          </div>
        ) : (
          <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[#14161f]">
                  <th className="px-4 py-3 text-left text-[#555] text-[11px] uppercase tracking-widest font-medium">Ishchi</th>
                  <th className="px-4 py-3 text-center text-[#555] text-[11px] uppercase tracking-widest font-medium">Ishlagan kun</th>
                  <th className="px-4 py-3 text-center text-amber-400 text-[11px] uppercase tracking-widest font-medium">Overtime</th>
                  {hasPoints && <th className="px-4 py-3 text-center text-blue-400 text-[11px] uppercase tracking-widest font-medium">Ball</th>}
                  <th className="px-4 py-3 text-right text-emerald-400 text-[11px] uppercase tracking-widest font-medium">Oylik</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((w) => (
                  <tr key={w._id} className="border-t border-[#23262f] hover:bg-[#1f2235] transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{w.fullName}</p>
                      {w.position && <p className="text-xs text-[#555]">{w.position}</p>}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-white">{w.workDays}</td>
                    <td className="px-4 py-3 text-center text-amber-400 font-semibold">{w.overtimeHours} h</td>
                    {hasPoints && (
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className={`font-semibold ${w.points > 0 ? 'text-emerald-400' : w.points < 0 ? 'text-red-400' : 'text-[#666]'}`}>{w.points > 0 ? '+' : ''}{w.points}</span>
                        {w.pointBonus !== 0 && <div className={`text-[11px] ${w.pointBonus > 0 ? 'text-emerald-400/70' : 'text-red-400/70'}`}>{w.pointBonus > 0 ? '+' : '−'}{fmtMoney(Math.abs(w.pointBonus))}</div>}
                      </td>
                    )}
                    <td className="px-4 py-3 text-right text-emerald-400 font-bold whitespace-nowrap">{fmtMoney(w.totalSalary)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-[#444] text-[11px] mt-3">
          Oylik kelish-ketishdan avtomatik hisoblanadi · ish kunlari (yakshanbasiz): {sheet?.totalWorkDays ?? '—'} · maoshni Ustalar profilida belgilang · kunlik kelish/ketish — <b className="text-[#666]">Davomat</b> bo'limida
          {hasPoints && <> · <b className="text-[#666]">Ball</b> KPI'dan (1 ball = {fmtMoney(sheet?.pointValue ?? 0)} so'm) — jami {totalPointBonus >= 0 ? '+' : '−'}{fmtMoney(Math.abs(totalPointBonus))} so'm ta'sir qildi</>}
        </p>
      </div>
    </div>
  );
}
