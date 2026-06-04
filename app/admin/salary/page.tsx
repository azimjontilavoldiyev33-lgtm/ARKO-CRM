'use client';

import { useEffect, useState, useCallback } from 'react';

interface DayCell { in: string; out: string | null; otMin: number }
interface Row {
  _id: string;
  fullName: string;
  position: string;
  salary: number;
  days: Record<string, DayCell>;
  workDays: number;
  overtimeHours: number;
  overtimePay: number;
  baseEarned: number;
  totalSalary: number;
}
interface Sheet {
  month: number;
  year: number;
  daysInMonth: number;
  totalWorkDays: number;
  workers: Row[];
}

const MONTHS = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
const DOW = ['Ya','Du','Se','Ch','Pa','Ju','Sh']; // 0=Yakshanba

const fmtTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : '';
const fmtMoney = (n: number) => n.toLocaleString('uz-UZ');

export default function SalaryPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [loading, setLoading] = useState(true);

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

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const dayNumbers = sheet ? Array.from({ length: sheet.daysInMonth }, (_, i) => i + 1) : [];
  const isSunday = (d: number) => new Date(year, month - 1, d).getDay() === 0;

  return (
    <div className="min-h-screen bg-[#0f1117] text-[#e8e8e8]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');`}</style>

      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <p className="text-[#555] text-[11px] uppercase tracking-[2px] mb-1">Mebel CRM</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-br from-white to-[#888] bg-clip-text text-transparent m-0" style={{ fontFamily: "'Syne', sans-serif" }}>
              Oylik hisob
            </h1>
          </div>

          {/* Month nav */}
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="w-9 h-9 rounded-xl bg-[#1a1d27] border border-[#2a2d3a] text-[#888] hover:text-white transition">◀</button>
            <div className="px-4 py-2 rounded-xl bg-[#1a1d27] border border-[#2a2d3a] text-center min-w-[150px]">
              <span className="font-semibold text-sm">{MONTHS[month - 1]} {year}</span>
              {isArchive && <span className="ml-2 text-[10px] text-[#f0c040] uppercase tracking-wide">arxiv</span>}
            </div>
            <button onClick={nextMonth} className="w-9 h-9 rounded-xl bg-[#1a1d27] border border-[#2a2d3a] text-[#888] hover:text-white transition">▶</button>
          </div>
        </div>

        {/* Info */}
        <p className="text-[#555] text-xs mb-4">
          Oylik kelish-ketishdan avtomatik hisoblanadi · Ish kunlari (yakshanbasiz): <span className="text-[#888]">{sheet?.totalWorkDays ?? '—'}</span> · Eksport (Excel/PDF) — keyingi bosqichda
        </p>

        {loading ? (
          <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] py-16 flex flex-col items-center gap-3 text-[#555]">
            <div className="w-8 h-8 rounded-full border-2 border-[#f0c040] border-t-transparent animate-spin" />
            <p className="text-sm">Yuklanmoqda...</p>
          </div>
        ) : !sheet || sheet.workers.length === 0 ? (
          <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] py-20 text-center text-[#555]">
            <p className="text-5xl mb-3">💰</p>
            <p className="text-sm">Ishchi yo'q yoki ma'lumot topilmadi</p>
          </div>
        ) : (
          <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="border-collapse text-xs">
                <thead>
                  <tr className="bg-[#14161f]">
                    <th className="sticky left-0 z-20 bg-[#14161f] px-3 py-2.5 text-left text-[#888] font-medium border-r border-[#2a2d3a] min-w-[160px]">
                      Ishchi
                    </th>
                    {dayNumbers.map((d) => (
                      <th key={d} className={`px-1.5 py-2 text-center font-medium min-w-[62px] border-r border-[#23262f] ${isSunday(d) ? 'text-[#5a3a3a] bg-[#1d1518]' : 'text-[#666]'}`}>
                        <div className="text-[13px] text-[#aaa]">{d}</div>
                        <div className="text-[9px] uppercase">{DOW[new Date(year, month - 1, d).getDay()]}</div>
                      </th>
                    ))}
                    <th className="px-3 py-2.5 text-center text-[#888] font-medium border-l border-[#2a2d3a] min-w-[55px]">Kun</th>
                    <th className="px-3 py-2.5 text-center text-amber-400 font-medium min-w-[60px]">OT</th>
                    <th className="px-3 py-2.5 text-right text-emerald-400 font-medium min-w-[110px]">Oylik</th>
                  </tr>
                </thead>
                <tbody>
                  {sheet.workers.map((w) => (
                    <tr key={w._id} className="border-t border-[#23262f] hover:bg-[#1f2235] transition-colors">
                      <td className="sticky left-0 z-10 bg-[#1a1d27] px-3 py-2 border-r border-[#2a2d3a]">
                        <p className="font-medium text-[13px] text-white whitespace-nowrap">{w.fullName}</p>
                        {w.position && <p className="text-[10px] text-[#555]">{w.position}</p>}
                      </td>
                      {dayNumbers.map((d) => {
                        const cell = w.days[String(d)];
                        const sun = isSunday(d);
                        return (
                          <td key={d} className={`px-1 py-1.5 text-center align-top border-r border-[#23262f] ${sun ? 'bg-[#17121400]' : ''}`}>
                            {cell ? (
                              <div className="leading-tight">
                                <div className="text-emerald-400 text-[10px]">{fmtTime(cell.in)}</div>
                                <div className="text-red-400 text-[10px]">{cell.out ? fmtTime(cell.out) : '·'}</div>
                                {cell.otMin > 0 && (
                                  <div className="text-amber-400 text-[9px] font-semibold">+{(cell.otMin / 60).toFixed(1)}h</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-[#2e313c]">–</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-center border-l border-[#2a2d3a] font-semibold text-white">{w.workDays}</td>
                      <td className="px-3 py-2 text-center text-amber-400 font-semibold">{w.overtimeHours}h</td>
                      <td className="px-3 py-2 text-right text-emerald-400 font-bold whitespace-nowrap">{fmtMoney(w.totalSalary)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="text-[#444] text-[11px] mt-3">
          🟢 keldi · 🔴 ketdi · 🟡 qo'shimcha vaqt · Kun = ishlagan kunlar · OT = qo'shimcha soat
        </p>
      </div>
    </div>
  );
}
