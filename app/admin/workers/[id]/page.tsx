'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Task {
  _id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  deadline: string;
  startedAt?: string;
  completedAt?: string;
  order: { title: string };
  rating?: number;
}

interface Worker {
  _id: string;
  fullName: string;
  phoneNumber: string;
  position?: string;
  telegramChatId?: string;
  createdAt: string;
}

const STATUS_LABELS = {
  pending: { label: 'Kutilmoqda', color: '#60a5fa', bg: '#1a2a3a' },
  in_progress: { label: 'Jarayonda', color: '#f0c040', bg: '#2a2410' },
  completed: { label: 'Tugallangan', color: '#4ade80', bg: '#142614' },
};

export default function WorkerProfilePage() {
  const { id } = useParams();
  const [worker, setWorker] = useState<Worker | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingTask, setRatingTask] = useState<string | null>(null);
  const [rating, setRating] = useState(5);

  const fetchData = async () => {
    setLoading(true);
    const [workerRes, tasksRes] = await Promise.all([
      fetch(`/api/workers/${id}`),
      fetch(`/api/tasks?worker=${id}`),
    ]);
    setWorker(await workerRes.json());
    setTasks(await tasksRes.json());
    setLoading(false);
  };

useEffect(() => {
  fetchData();

  const eventSource = new EventSource('/api/events');
  eventSource.onmessage = () => {
    fetchData();
  };
  return () => eventSource.close();
}, []);

  const handleRating = async (taskId: string) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating }),
    });
    setRatingTask(null);
    fetchData();
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontFamily: "'DM Sans', sans-serif" }}>
      Yuklanmoqda...
    </div>
  );

  if (!worker) return (
    <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontFamily: "'DM Sans', sans-serif" }}>
      Usta topilmadi
    </div>
  );

  const completedTasks = tasks.filter(t => t.status === 'completed');
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const overdueTasks = tasks.filter(t => new Date(t.deadline) < new Date() && t.status !== 'completed');
  const ratedTasks = completedTasks.filter(t => t.rating);
  const avgRating = ratedTasks.length > 0
    ? (ratedTasks.reduce((sum, t) => sum + (t.rating || 0), 0) / ratedTasks.length).toFixed(1)
    : '—';

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', color: '#e8e8e8', fontFamily: "'DM Sans', sans-serif", padding: '32px' }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap" rel="stylesheet" />

      {/* Back */}
      <a href="/admin/workers" style={{ color: '#555', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '24px' }}>
        ← Ustalarga qaytish
      </a>

      {/* Worker Header */}
      <div style={{ background: '#1a1d27', borderRadius: '20px', padding: '28px', border: '1px solid #2a2d3a', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '16px', background: '#f0c040', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Syne', sans-serif", fontSize: '28px', fontWeight: 800, color: '#0f1117', flexShrink: 0 }}>
          {worker.fullName[0]}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '24px', fontWeight: 800, margin: '0 0 6px' }}>{worker.fullName}</h1>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ color: '#666', fontSize: '13px' }}>📞 +{worker.phoneNumber}</span>
            {worker.position && <span style={{ color: '#666', fontSize: '13px' }}>💼 {worker.position}</span>}
            <span style={{ color: '#666', fontSize: '13px' }}>📅 {new Date(worker.createdAt).toLocaleDateString('uz-UZ')} dan</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {worker.telegramChatId ? (
            <span style={{ background: '#142614', color: '#4ade80', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 600 }}>✓ Telegram ulangan</span>
          ) : (
            <span style={{ background: '#261414', color: '#f87171', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 600 }}>✗ Telegram ulanmagan</span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Jami vazifa', value: tasks.length, color: '#e8e8e8' },
          { label: 'Bajarilgan', value: completedTasks.length, color: '#4ade80' },
          { label: 'Jarayonda', value: inProgressTasks.length, color: '#f0c040' },
          { label: 'Kechikkan', value: overdueTasks.length, color: '#f87171' },
          { label: 'O\'rtacha baho', value: avgRating, color: '#f0c040' },
        ].map((stat, i) => (
          <div key={i} style={{ background: '#1a1d27', borderRadius: '14px', padding: '20px', border: '1px solid #2a2d3a', textAlign: 'center' }}>
            <p style={{ color: '#555', fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 8px' }}>{stat.label}</p>
            <p style={{ fontFamily: "'Syne', sans-serif", fontSize: '28px', fontWeight: 800, color: stat.color, margin: 0 }}>
              {i === 4 ? `⭐ ${stat.value}` : stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Tasks */}
      <div style={{ background: '#1a1d27', borderRadius: '16px', border: '1px solid #2a2d3a', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #2a2d3a' }}>
          <p style={{ margin: 0, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '16px' }}>Barcha vazifalar</p>
        </div>

        {tasks.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#555' }}>
            <p style={{ fontSize: '40px', margin: '0 0 12px' }}>📋</p>
            <p>Hali vazifa yo'q</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#14161f' }}>
                {['Vazifa', 'Buyurtma', 'Muddat', 'Boshlandi', 'Tugadi', 'Status', 'Baho', ''].map((h, i) => (
                  <th key={i} style={{ padding: '12px 20px', textAlign: 'left', color: '#555', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const status = STATUS_LABELS[task.status];
                const isOverdue = new Date(task.deadline) < new Date() && task.status !== 'completed';
                return (
                  <tr key={task._id} style={{ borderTop: '1px solid #2a2d3a' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#1f2235')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '14px 20px', fontWeight: 500, fontSize: '14px' }}>{task.title}</td>
                    <td style={{ padding: '14px 20px', color: '#666', fontSize: '13px' }}>{task.order?.title}</td>
                    <td style={{ padding: '14px 20px', fontSize: '13px', color: isOverdue ? '#f87171' : '#666' }}>
                      {isOverdue ? '⚠️ ' : ''}{new Date(task.deadline).toLocaleDateString('uz-UZ')}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#666', fontSize: '13px' }}>
                      {task.startedAt ? new Date(task.startedAt).toLocaleDateString('uz-UZ') : '—'}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#666', fontSize: '13px' }}>
                      {task.completedAt ? new Date(task.completedAt).toLocaleDateString('uz-UZ') : '—'}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ background: status.bg, color: status.color, borderRadius: '6px', padding: '4px 10px', fontSize: '12px', fontWeight: 600 }}>
                        {status.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      {task.rating ? (
                        <span style={{ color: '#f0c040' }}>{'⭐'.repeat(task.rating)}</span>
                      ) : task.status === 'completed' ? (
                        <button
                          onClick={() => setRatingTask(task._id)}
                          style={{ background: '#2a2410', border: '1px solid #f0c040', color: '#f0c040', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer' }}
                        >
                          Baholash
                        </button>
                      ) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Rating Modal */}
      {ratingTask && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#1a1d27', borderRadius: '20px', padding: '32px', width: '360px', border: '1px solid #2a2d3a', textAlign: 'center' }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '20px', fontWeight: 800, margin: '0 0 24px' }}>Ishni baholang</h2>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  style={{ background: 'none', border: 'none', fontSize: '32px', cursor: 'pointer', opacity: star <= rating ? 1 : 0.3, transition: 'opacity 0.15s' }}
                >
                  ⭐
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setRatingTask(null)} style={{ flex: 1, background: 'transparent', border: '1px solid #2a2d3a', color: '#888', borderRadius: '10px', padding: '12px', cursor: 'pointer' }}>
                Bekor
              </button>
              <button onClick={() => handleRating(ratingTask)} style={{ flex: 1, background: '#f0c040', color: '#0f1117', border: 'none', borderRadius: '10px', padding: '12px', fontFamily: "'Syne', sans-serif", fontWeight: 700, cursor: 'pointer' }}>
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}