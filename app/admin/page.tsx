'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stats {
  workers: { total: number };
  orders: { total: number; new: number; in_progress: number; completed: number };
  tasks: { total: number; pending: number; in_progress: number; completed: number; overdue: number };
}

interface RecentTask {
  _id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  deadline: string;
  worker: { fullName: string };
  order: { title: string };
}

const STATUS_LABELS = {
  pending:     { label: 'Kutilmoqda', className: 'bg-[#1a2a3a] text-[#60a5fa]' },
  in_progress: { label: 'Jarayonda',  className: 'bg-[#2a2410] text-[#f0c040]' },
  completed:   { label: 'Tugallangan',className: 'bg-[#142614] text-[#4ade80]' },
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchData = async () => {
    try {
      const [workersRes, ordersRes, tasksRes] = await Promise.all([
        fetch('/api/workers'),
        fetch('/api/orders'),
        fetch('/api/tasks'),
      ]);
      const workers = await workersRes.json();
      const orders  = await ordersRes.json();
      const tasks   = await tasksRes.json();
      const now     = new Date();

      setStats({
        workers: {
          total: workers.length,
        },
        orders: {
          total:       orders.length,
          new:         orders.filter((o: any) => o.status === 'new').length,
          in_progress: orders.filter((o: any) => o.status === 'in_progress').length,
          completed:   orders.filter((o: any) => o.status === 'completed').length,
        },
        tasks: {
          total:       tasks.length,
          pending:     tasks.filter((t: any) => t.status === 'pending').length,
          in_progress: tasks.filter((t: any) => t.status === 'in_progress').length,
          completed:   tasks.filter((t: any) => t.status === 'completed').length,
          overdue:     tasks.filter((t: any) => new Date(t.deadline) < now && t.status !== 'completed').length,
        },
      });
      setRecentTasks(tasks.slice(0, 8));
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Dashboard xatosi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const es = new EventSource('/api/sse');
    es.onmessage = () => fetchData();
    return () => es.close();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center text-[#555] font-sans">
      <div className="text-center">
        <div className="text-5xl mb-4">⚙️</div>
        <p>Yuklanmoqda...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f1117] text-[#e8e8e8] font-sans p-4 sm:p-6 lg:p-8">
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap"
        rel="stylesheet"
      />

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8 sm:mb-10">
        <div>
          <p className="text-[#555] text-[11px] tracking-[2px] uppercase mb-1.5">Mebel CRM</p>
          <h1
            className="text-3xl sm:text-4xl font-extrabold m-0 bg-gradient-to-br from-white to-[#888] bg-clip-text text-transparent"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Dashboard
          </h1>
        </div>
        <div className="flex sm:flex-col sm:items-end gap-3 sm:gap-0">
          <button
            onClick={fetchData}
            className="bg-[#1a1d27] border border-[#2a2d3a] text-[#888] rounded-xl px-4 py-2.5 text-sm cursor-pointer hover:text-[#e8e8e8] hover:border-[#3a3d4a] transition-all sm:mb-2"
          >
            🔄 Yangilash
          </button>
          <p className="text-[#444] text-xs m-0 self-end sm:self-auto">
            {lastUpdated.toLocaleTimeString('uz-UZ')} da yangilandi
          </p>
        </div>
      </div>

      {/* ── Quick Nav ──────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 sm:gap-3 mb-7 sm:mb-8">
        {[
          { label: '👷 Ustalar',     href: '/admin/workers' },
          { label: '📦 Buyurtmalar', href: '/admin/orders' },
          { label: '📋 Vazifalar',   href: '/admin/tasks' },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-[#1a1d27] border border-[#2a2d3a] text-[#888] rounded-xl px-4 py-2.5 text-sm no-underline hover:text-[#e8e8e8] hover:border-[#3a3d4a] transition-all"
          >
            {link.label}
          </Link>
        ))}
      </div>

      {stats && (
        <>
          {/* ── Overdue Alert ─────────────────────────────── */}
          {stats.tasks.overdue > 0 && (
            <div className="bg-[#2a1414] border border-[#4a1a1a] rounded-2xl p-4 sm:p-5 mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-2xl shrink-0">⚠️</span>
              <div className="flex-1 min-w-0">
                <p className="m-0 mb-0.5 text-[#f87171] font-semibold text-sm sm:text-base">
                  {stats.tasks.overdue} ta vazifa kechikmoqda!
                </p>
                <p className="m-0 text-[#884444] text-xs sm:text-sm">
                  Muddati o'tgan vazifalarni tekshiring
                </p>
              </div>
              <Link
                href="/admin/tasks"
                className="self-start sm:self-auto bg-[#f87171] text-white rounded-lg px-4 py-2 text-sm no-underline font-semibold whitespace-nowrap hover:bg-[#f85050] transition-colors"
              >
                Ko'rish →
              </Link>
            </div>
          )}

          {/* ── Stat Cards ────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
            {/* Workers */}
            <div className="bg-[#1a1d27] rounded-2xl p-5 sm:p-6 border border-[#2a2d3a]">
              <div className="flex justify-between items-start mb-4">
                <p className="m-0 text-[#555] text-[11px] tracking-[1.5px] uppercase">Ustalar</p>
                <span className="text-2xl">👷</span>
              </div>
              <p
                className="text-4xl sm:text-5xl font-extrabold m-0 mb-3 text-[#e8e8e8]"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                {stats.workers.total}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-[#1a2a3a] text-[#60a5fa] rounded-md px-2.5 py-1 text-xs">Faol ustalar</span>
              </div>
            </div>

            {/* Orders */}
            <div className="bg-[#1a1d27] rounded-2xl p-5 sm:p-6 border border-[#2a2d3a]">
              <div className="flex justify-between items-start mb-4">
                <p className="m-0 text-[#555] text-[11px] tracking-[1.5px] uppercase">Buyurtmalar</p>
                <span className="text-2xl">📦</span>
              </div>
              <p
                className="text-4xl sm:text-5xl font-extrabold m-0 mb-3 text-[#e8e8e8]"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                {stats.orders.total}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-[#1a2a3a] text-[#60a5fa] rounded-md px-2.5 py-1 text-xs">{stats.orders.new} yangi</span>
                <span className="bg-[#2a2410] text-[#f0c040] rounded-md px-2.5 py-1 text-xs">{stats.orders.in_progress} jarayonda</span>
                <span className="bg-[#142614] text-[#4ade80] rounded-md px-2.5 py-1 text-xs">{stats.orders.completed} tugagan</span>
              </div>
            </div>

            {/* Tasks */}
            <div className="bg-[#1a1d27] rounded-2xl p-5 sm:p-6 border border-[#2a2d3a]">
              <div className="flex justify-between items-start mb-4">
                <p className="m-0 text-[#555] text-[11px] tracking-[1.5px] uppercase">Vazifalar</p>
                <span className="text-2xl">📋</span>
              </div>
              <p
                className="text-4xl sm:text-5xl font-extrabold m-0 mb-3 text-[#e8e8e8]"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                {stats.tasks.total}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-[#1a2a3a] text-[#60a5fa] rounded-md px-2.5 py-1 text-xs">{stats.tasks.pending} kutilmoqda</span>
                <span className="bg-[#2a2410] text-[#f0c040] rounded-md px-2.5 py-1 text-xs">{stats.tasks.in_progress} jarayonda</span>
                <span className="bg-[#142614] text-[#4ade80] rounded-md px-2.5 py-1 text-xs">{stats.tasks.completed} tugagan</span>
              </div>
            </div>
          </div>

          {/* ── Progress Bars ─────────────────────────────── */}
          <div className="bg-[#1a1d27] rounded-2xl p-5 sm:p-6 border border-[#2a2d3a] mb-6">
            <p
              className="m-0 mb-5 font-bold text-base sm:text-lg"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Umumiy progress
            </p>
            <div className="flex flex-col gap-4">
              {[
                { label: 'Buyurtmalar bajarilishi', value: stats.orders.completed, total: stats.orders.total, color: 'bg-[#4ade80]', textColor: 'text-[#4ade80]' },
                { label: 'Vazifalar bajarilishi',   value: stats.tasks.completed,  total: stats.tasks.total,  color: 'bg-[#60a5fa]', textColor: 'text-[#60a5fa]' },
              ].map((item, i) => {
                const percent = item.total > 0 ? Math.round((item.value / item.total) * 100) : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between mb-2">
                      <span className="text-[#888] text-sm">{item.label}</span>
                      <span className={`text-sm font-semibold ${item.textColor}`}>{percent}%</span>
                    </div>
                    <div className="bg-[#14161f] rounded h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded transition-all duration-500 ${item.color}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ── Recent Tasks ───────────────────────────────────── */}
      <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] overflow-hidden">
        <div className="flex justify-between items-center px-5 sm:px-6 py-4 sm:py-5 border-b border-[#2a2d3a]">
          <p
            className="m-0 font-bold text-base"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            So'nggi vazifalar
          </p>
          <Link href="/admin/tasks" className="text-[#f0c040] text-sm no-underline hover:opacity-80 transition-opacity">
            Barchasi →
          </Link>
        </div>

        {recentTasks.length === 0 ? (
          <div className="p-10 text-center text-[#555]">Hali vazifa yo'q</div>
        ) : (
          <>
            {/* ── Desktop table (md+) ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#14161f]">
                    {['Vazifa', 'Buyurtma', 'Usta', 'Muddat', 'Status'].map((h, i) => (
                      <th
                        key={i}
                        className="px-6 py-3 text-left text-[#555] text-xs tracking-widest uppercase font-medium"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentTasks.map((task) => {
                    const status   = STATUS_LABELS[task.status];
                    const deadline = new Date(task.deadline);
                    const isOverdue = deadline < new Date() && task.status !== 'completed';
                    return (
                      <tr
                        key={task._id}
                        className="border-t border-[#2a2d3a] hover:bg-[#1f2235] transition-colors"
                      >
                        <td className="px-6 py-3.5 font-medium text-sm">{task.title}</td>
                        <td className="px-6 py-3.5 text-[#666] text-sm">{task.order?.title}</td>
                        <td className="px-6 py-3.5 text-[#666] text-sm">{task.worker?.fullName}</td>
                        <td className={`px-6 py-3.5 text-sm ${isOverdue ? 'text-[#f87171]' : 'text-[#666]'}`}>
                          {isOverdue ? '⚠️ ' : ''}{deadline.toLocaleDateString('uz-UZ')}
                        </td>
                        <td className="px-6 py-3.5">
                          <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${status.className}`}>
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Mobile cards (< md) ── */}
            <div className="md:hidden divide-y divide-[#2a2d3a]">
              {recentTasks.map((task) => {
                const status    = STATUS_LABELS[task.status];
                const deadline  = new Date(task.deadline);
                const isOverdue = deadline < new Date() && task.status !== 'completed';
                return (
                  <div key={task._id} className="px-4 py-3.5 flex flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="m-0 font-medium text-sm leading-snug">{task.title}</p>
                      <span className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-[#666]">
                      <span>📦 {task.order?.title}</span>
                      <span>👷 {task.worker?.fullName}</span>
                      <span className={isOverdue ? 'text-[#f87171]' : ''}>
                        🗓 {isOverdue ? '⚠️ ' : ''}{deadline.toLocaleDateString('uz-UZ')}
                      </span>
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