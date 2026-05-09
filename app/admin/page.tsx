'use client';

import { useEffect, useState } from 'react';

interface Stats {
  workers: { total: number; connected: number };
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
  pending: { label: 'Kutilmoqda', color: '#60a5fa', bg: '#1a2a3a' },
  in_progress: { label: 'Jarayonda', color: '#f0c040', bg: '#2a2410' },
  completed: { label: 'Tugallangan', color: '#4ade80', bg: '#142614' },
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
      const orders = await ordersRes.json();
      const tasks = await tasksRes.json();

      const now = new Date();
      setStats({
        workers: {
          total: workers.length,
          connected: workers.filter((w: any) => w.telegramChatId).length,
        },
        orders: {
          total: orders.length,
          new: orders.filter((o: any) => o.status === 'new').length,
          in_progress: orders.filter((o: any) => o.status === 'in_progress').length,
          completed: orders.filter((o: any) => o.status === 'completed').length,
        },
        tasks: {
          total: tasks.length,
          pending: tasks.filter((t: any) => t.status === 'pending').length,
          in_progress: tasks.filter((t: any) => t.status === 'in_progress').length,
          completed: tasks.filter((t: any) => t.status === 'completed').length,
          overdue: tasks.filter((t: any) => new Date(t.deadline) < now && t.status !== 'completed').length,
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
    // Har 30 sekundda yangilanadi
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚙️</div>
        <p>Yuklanmoqda...</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', color: '#e8e8e8', fontFamily: "'DM Sans', sans-serif", padding: '32px' }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
        <div>
          <p style={{ color: '#555', fontSize: '13px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>Mebel CRM</p>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '36px', fontWeight: 800, margin: 0, background: 'linear-gradient(135deg, #fff 0%, #888 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Dashboard
          </h1>
        </div>
        <div style={{ textAlign: 'right' }}>
          <button
            onClick={fetchData}
            style={{ background: '#1a1d27', border: '1px solid #2a2d3a', color: '#888', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', cursor: 'pointer', marginBottom: '8px' }}
          >
            🔄 Yangilash
          </button>
          <p style={{ margin: 0, color: '#444', fontSize: '12px' }}>
            {lastUpdated.toLocaleTimeString('uz-UZ')} da yangilandi
          </p>
        </div>
      </div>

      {/* Nav Links */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
        {[
          { label: '👷 Ustalar', href: '/admin/workers' },
          { label: '📦 Buyurtmalar', href: '/admin/orders' },
          { label: '📋 Vazifalar', href: '/admin/tasks' },
        ].map((link) => (
          <a key={link.href} href={link.href} style={{ background: '#1a1d27', border: '1px solid #2a2d3a', color: '#888', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', textDecoration: 'none', transition: 'all 0.2s' }}
            onMouseEnter={e => { (e.target as HTMLElement).style.color = '#e8e8e8'; (e.target as HTMLElement).style.borderColor = '#3a3d4a'; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.color = '#888'; (e.target as HTMLElement).style.borderColor = '#2a2d3a'; }}
          >
            {link.label}
          </a>
        ))}
      </div>

      {stats && (
        <>
          {/* Overdue Alert */}
          {stats.tasks.overdue > 0 && (
            <div style={{ background: '#2a1414', border: '1px solid #4a1a1a', borderRadius: '14px', padding: '16px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>⚠️</span>
              <div>
                <p style={{ margin: '0 0 2px', color: '#f87171', fontWeight: 600, fontSize: '15px' }}>
                  {stats.tasks.overdue} ta vazifa kechikmoqda!
                </p>
                <p style={{ margin: 0, color: '#884444', fontSize: '13px' }}>
                  Muddati o'tgan vazifalarni tekshiring
                </p>
              </div>
              <a href="/admin/tasks" style={{ marginLeft: 'auto', background: '#f87171', color: '#fff', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', textDecoration: 'none', fontWeight: 600 }}>
                Ko'rish →
              </a>
            </div>
          )}

          {/* Main Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {/* Workers */}
            <div style={{ background: '#1a1d27', borderRadius: '16px', padding: '24px', border: '1px solid #2a2d3a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <p style={{ margin: 0, color: '#555', fontSize: '12px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Ustalar</p>
                <span style={{ fontSize: '24px' }}>👷</span>
              </div>
              <p style={{ fontFamily: "'Syne', sans-serif", fontSize: '40px', fontWeight: 800, margin: '0 0 12px', color: '#e8e8e8' }}>{stats.workers.total}</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ background: '#142614', color: '#4ade80', borderRadius: '6px', padding: '4px 10px', fontSize: '12px' }}>✓ {stats.workers.connected} ulangan</span>
                <span style={{ background: '#261414', color: '#f87171', borderRadius: '6px', padding: '4px 10px', fontSize: '12px' }}>✗ {stats.workers.total - stats.workers.connected} ulanmagan</span>
              </div>
            </div>

            {/* Orders */}
            <div style={{ background: '#1a1d27', borderRadius: '16px', padding: '24px', border: '1px solid #2a2d3a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <p style={{ margin: 0, color: '#555', fontSize: '12px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Buyurtmalar</p>
                <span style={{ fontSize: '24px' }}>📦</span>
              </div>
              <p style={{ fontFamily: "'Syne', sans-serif", fontSize: '40px', fontWeight: 800, margin: '0 0 12px', color: '#e8e8e8' }}>{stats.orders.total}</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ background: '#1a2a3a', color: '#60a5fa', borderRadius: '6px', padding: '4px 10px', fontSize: '12px' }}>{stats.orders.new} yangi</span>
                <span style={{ background: '#2a2410', color: '#f0c040', borderRadius: '6px', padding: '4px 10px', fontSize: '12px' }}>{stats.orders.in_progress} jarayonda</span>
                <span style={{ background: '#142614', color: '#4ade80', borderRadius: '6px', padding: '4px 10px', fontSize: '12px' }}>{stats.orders.completed} tugagan</span>
              </div>
            </div>

            {/* Tasks */}
            <div style={{ background: '#1a1d27', borderRadius: '16px', padding: '24px', border: '1px solid #2a2d3a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <p style={{ margin: 0, color: '#555', fontSize: '12px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Vazifalar</p>
                <span style={{ fontSize: '24px' }}>📋</span>
              </div>
              <p style={{ fontFamily: "'Syne', sans-serif", fontSize: '40px', fontWeight: 800, margin: '0 0 12px', color: '#e8e8e8' }}>{stats.tasks.total}</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ background: '#1a2a3a', color: '#60a5fa', borderRadius: '6px', padding: '4px 10px', fontSize: '12px' }}>{stats.tasks.pending} kutilmoqda</span>
                <span style={{ background: '#2a2410', color: '#f0c040', borderRadius: '6px', padding: '4px 10px', fontSize: '12px' }}>{stats.tasks.in_progress} jarayonda</span>
                <span style={{ background: '#142614', color: '#4ade80', borderRadius: '6px', padding: '4px 10px', fontSize: '12px' }}>{stats.tasks.completed} tugagan</span>
              </div>
            </div>
          </div>

          {/* Progress bars */}
          <div style={{ background: '#1a1d27', borderRadius: '16px', padding: '24px', border: '1px solid #2a2d3a', marginBottom: '24px' }}>
            <p style={{ margin: '0 0 20px', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '16px' }}>Umumiy progress</p>
            {[
              { label: 'Buyurtmalar bajarilishi', value: stats.orders.completed, total: stats.orders.total, color: '#4ade80' },
              { label: 'Vazifalar bajarilishi', value: stats.tasks.completed, total: stats.tasks.total, color: '#60a5fa' },
              { label: 'Ustalar ulanishi', value: stats.workers.connected, total: stats.workers.total, color: '#f0c040' },
            ].map((item, i) => {
              const percent = item.total > 0 ? Math.round((item.value / item.total) * 100) : 0;
              return (
                <div key={i} style={{ marginBottom: i < 2 ? '16px' : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#888' }}>{item.label}</span>
                    <span style={{ fontSize: '13px', color: item.color, fontWeight: 600 }}>{percent}%</span>
                  </div>
                  <div style={{ background: '#14161f', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                    <div style={{ width: `${percent}%`, height: '100%', background: item.color, borderRadius: '4px', transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Recent Tasks */}
      <div style={{ background: '#1a1d27', borderRadius: '16px', border: '1px solid #2a2d3a', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #2a2d3a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '16px' }}>So'nggi vazifalar</p>
          <a href="/admin/tasks" style={{ color: '#f0c040', fontSize: '13px', textDecoration: 'none' }}>Barchasi →</a>
        </div>
        {recentTasks.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#555' }}>Hali vazifa yo'q</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#14161f' }}>
                {['Vazifa', 'Buyurtma', 'Usta', 'Muddat', 'Status'].map((h, i) => (
                  <th key={i} style={{ padding: '12px 24px', textAlign: 'left', color: '#555', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentTasks.map((task) => {
                const status = STATUS_LABELS[task.status];
                const deadline = new Date(task.deadline);
                const isOverdue = deadline < new Date() && task.status !== 'completed';
                return (
                  <tr key={task._id} style={{ borderTop: '1px solid #2a2d3a' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#1f2235')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '14px 24px', fontWeight: 500, fontSize: '14px' }}>{task.title}</td>
                    <td style={{ padding: '14px 24px', color: '#666', fontSize: '13px' }}>{task.order?.title}</td>
                    <td style={{ padding: '14px 24px', color: '#666', fontSize: '13px' }}>{task.worker?.fullName}</td>
                    <td style={{ padding: '14px 24px', fontSize: '13px', color: isOverdue ? '#f87171' : '#666' }}>
                      {isOverdue ? '⚠️ ' : ''}{deadline.toLocaleDateString('uz-UZ')}
                    </td>
                    <td style={{ padding: '14px 24px' }}>
                      <span style={{ background: status.bg, color: status.color, borderRadius: '6px', padding: '4px 10px', fontSize: '12px', fontWeight: 600 }}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}