'use client';

import { useEffect, useState } from 'react';

interface Worker {
  _id: string;
  fullName: string;
  phoneNumber: string;
  position?: string;
}

interface AttendanceRecord {
  worker: Worker;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  duration: string | null;
}

const inputCls =
  'bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-3.5 py-2.5 text-sm text-[#e8e8e8] outline-none focus:border-[#f0c040] transition placeholder-[#444] [color-scheme:dark]';

const fmtTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : '—';

const fmtDate = (d: string) => {
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric' });
};

const AVATAR_COLORS = [
  { bg: 'bg-[#1a2a3a]', text: 'text-[#60a5fa]' },
  { bg: 'bg-[#2a1a2a]', text: 'text-[#c084fc]' },
  { bg: 'bg-[#142614]', text: 'text-[#4ade80]' },
  { bg: 'bg-[#2a2410]', text: 'text-[#f0c040]' },
  { bg: 'bg-[#2a1414]', text: 'text-[#f87171]' },
];

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

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [workerId, setWorkerId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchWorkers = async () => {
    const res = await fetch('/api/workers');
    const data = await res.json();
    setWorkers(Array.isArray(data) ? data : data.data ?? []);
  };

  const fetchRecords = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (workerId) params.append('workerId', workerId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const res = await fetch(`/api/attendance/report?${params.toString()}`);
    const data = await res.json();
    if (data.success) setRecords(data.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchWorkers();
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = {
    total:    records.length,
    active:   records.filter(r => r.checkIn && !r.checkOut).length,
    finished: records.filter(r => r.checkOut).length,
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-[#e8e8e8]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');`}</style>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

        {/* ── Header ── */}
        <div className="mb-6 sm:mb-8">
          <p className="text-[#555] text-[11px] uppercase tracking-[2px] mb-1">Mebel CRM</p>
          <h1
            className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-br from-white to-[#888] bg-clip-text text-transparent m-0"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Davomat
          </h1>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard label="Yozuvlar"    value={stats.total}    color="text-white" />
          <StatCard label="Ishda"       value={stats.active}   color="text-amber-400" />
          <StatCard label="Yakunlangan" value={stats.finished} color="text-emerald-400" />
        </div>

        {/* ── Filterlar ── */}
        <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] p-4 sm:p-5 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1">
              <label className="block text-[#888] text-[11px] uppercase tracking-widest mb-1.5">Ishchi</label>
              <select value={workerId} onChange={(e) => setWorkerId(e.target.value)} className={`${inputCls} w-full`}>
                <option value="">Barcha ishchilar</option>
                {workers.map((w) => (
                  <option key={w._id} value={w._id} className="bg-[#1a1d27]">{w.fullName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[#888] text-[11px] uppercase tracking-widest mb-1.5">Dan</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-[#888] text-[11px] uppercase tracking-widest mb-1.5">Gacha</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
            </div>
            <button
              onClick={fetchRecords}
              className="bg-[#f0c040] text-[#0f1117] font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-[#d4a832] transition whitespace-nowrap"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Qidirish
            </button>
          </div>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] py-16 flex flex-col items-center gap-3 text-[#555]">
            <div className="w-8 h-8 rounded-full border-2 border-[#f0c040] border-t-transparent animate-spin" />
            <p className="text-sm">Yuklanmoqda...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] py-20 text-center text-[#555]">
            <p className="text-5xl mb-4">🗓</p>
            <p className="text-sm">Ma'lumot topilmadi</p>
          </div>
        ) : (
          <>
            {/* ── Desktop table (sm+) ── */}
            <div className="hidden sm:block bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#14161f]">
                    {['Ishchi', 'Sana', 'Keldi', 'Ketdi', 'Ish vaqti'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[#555] text-[11px] font-medium uppercase tracking-widest">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map((record, index) => {
                    const av = AVATAR_COLORS[index % AVATAR_COLORS.length];
                    return (
                      <tr key={index} className="border-t border-[#2a2d3a] hover:bg-[#1f2235] transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${av.bg} ${av.text}`}>
                              {record.worker?.fullName?.[0] ?? '?'}
                            </div>
                            <div>
                              <p className="font-medium text-sm text-white">{record.worker?.fullName}</p>
                              {record.worker?.position && (
                                <p className="text-xs text-[#555] mt-0.5">{record.worker.position}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-[#888] text-sm">{fmtDate(record.date)}</td>
                        <td className="px-5 py-3.5 text-sm text-emerald-400 font-medium">{fmtTime(record.checkIn)}</td>
                        <td className="px-5 py-3.5 text-sm text-red-400 font-medium">{fmtTime(record.checkOut)}</td>
                        <td className="px-5 py-3.5 text-sm text-[#aaa]">{record.duration ?? '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Mobile cards (< sm) ── */}
            <div className="sm:hidden space-y-3">
              {records.map((record, index) => {
                const av = AVATAR_COLORS[index % AVATAR_COLORS.length];
                return (
                  <div key={index} className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold shrink-0 ${av.bg} ${av.text}`}>
                        {record.worker?.fullName?.[0] ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-white">{record.worker?.fullName}</p>
                        <p className="text-xs text-[#555] mt-0.5">{fmtDate(record.date)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-[#14161f] rounded-xl py-2">
                        <p className="text-[10px] text-[#555] uppercase tracking-wide mb-0.5">Keldi</p>
                        <p className="text-xs font-medium text-emerald-400">{fmtTime(record.checkIn)}</p>
                      </div>
                      <div className="bg-[#14161f] rounded-xl py-2">
                        <p className="text-[10px] text-[#555] uppercase tracking-wide mb-0.5">Ketdi</p>
                        <p className="text-xs font-medium text-red-400">{fmtTime(record.checkOut)}</p>
                      </div>
                      <div className="bg-[#14161f] rounded-xl py-2">
                        <p className="text-[10px] text-[#555] uppercase tracking-wide mb-0.5">Vaqt</p>
                        <p className="text-xs font-medium text-[#aaa]">{record.duration ?? '—'}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
