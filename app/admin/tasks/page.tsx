'use client';

import { useEffect, useState } from 'react';

interface Worker {
  _id: string;
  fullName: string;
  telegramChatId?: string;
}

interface Order {
  _id: string;
  title: string;
}

interface Task {
  _id: string;
  title: string;
  order: { _id: string; title: string };
  worker: { _id: string; fullName: string };
  deadline: string;
  status: 'pending' | 'in_progress' | 'completed';
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

const STATUS_LABELS = {
  pending: { label: 'Kutilmoqda', color: '#60a5fa', bg: '#1a2a3a' },
  in_progress: { label: 'Jarayonda', color: '#f0c040', bg: '#2a2410' },
  completed: { label: 'Tugallangan', color: '#4ade80', bg: '#142614' },
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', order: '', worker: '', deadline: '' });

  const fetchAll = async () => {
    setLoading(true);
    const [tasksRes, workersRes, ordersRes] = await Promise.all([
      fetch('/api/tasks'),
      fetch('/api/workers'),
      fetch('/api/orders'),
    ]);
    setTasks(await tasksRes.json());
    setWorkers(await workersRes.json());
    setOrders(await ordersRes.json());
    setLoading(false);
  };

useEffect(() => {
  fetchAll();

  // Real-time: har 5 sekundda avtomatik yangilanish
  const eventSource = new EventSource('/api/events');
  eventSource.onmessage = () => {
    fetchAll();
  };
  return () => eventSource.close();
}, []);

  const handleSubmit = async () => {
    if (!form.title || !form.order || !form.worker || !form.deadline) return;
    setSaving(true);
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setForm({ title: '', order: '', worker: '', deadline: '' });
    setShowModal(false);
    setSaving(false);
    fetchAll();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Vazifani o\'chirmoqchimisiz?')) return;
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    fetchAll();
  };

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', color: '#e8e8e8', fontFamily: "'DM Sans', sans-serif", padding: '32px' }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
        <div>
          <p style={{ color: '#555', fontSize: '13px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>Mebel CRM</p>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '36px', fontWeight: 800, margin: 0, background: 'linear-gradient(135deg, #fff 0%, #888 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Vazifalar
          </h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ background: '#f0c040', color: '#0f1117', border: 'none', borderRadius: '10px', padding: '12px 24px', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
        >
          + Vazifa qo'shish
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Jami', value: stats.total, color: '#e8e8e8' },
          { label: 'Kutilmoqda', value: stats.pending, color: '#60a5fa' },
          { label: 'Jarayonda', value: stats.in_progress, color: '#f0c040' },
          { label: 'Tugallangan', value: stats.completed, color: '#4ade80' },
        ].map((stat, i) => (
          <div key={i} style={{ background: '#1a1d27', borderRadius: '14px', padding: '20px 24px', border: '1px solid #2a2d3a' }}>
            <p style={{ color: '#555', fontSize: '12px', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 8px' }}>{stat.label}</p>
            <p style={{ fontFamily: "'Syne', sans-serif", fontSize: '32px', fontWeight: 800, color: stat.color, margin: 0 }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tasks List */}
      <div style={{ display: 'grid', gap: '12px' }}>
        {loading ? (
          <div style={{ background: '#1a1d27', borderRadius: '16px', padding: '60px', textAlign: 'center', color: '#555' }}>Yuklanmoqda...</div>
        ) : tasks.length === 0 ? (
          <div style={{ background: '#1a1d27', borderRadius: '16px', padding: '60px', textAlign: 'center', color: '#555' }}>
            <p style={{ fontSize: '40px', margin: '0 0 12px' }}>📋</p>
            <p>Hali vazifa qo'shilmagan</p>
          </div>
        ) : tasks.map((task) => {
          const status = STATUS_LABELS[task.status];
          const deadline = new Date(task.deadline);
          const isOverdue = deadline < new Date() && task.status !== 'completed';
          return (
            <div key={task._id} style={{ background: '#1a1d27', borderRadius: '16px', padding: '20px 24px', border: `1px solid ${isOverdue ? '#3a1a1a' : '#2a2d3a'}`, display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Icon */}
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#14161f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                📋
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: '15px' }}>{task.title}</p>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>📦 {task.order?.title}</p>
                  <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>👷 {task.worker?.fullName}</p>
                  <p style={{ margin: 0, fontSize: '13px', color: isOverdue ? '#f87171' : '#666' }}>
                    ⏰ {isOverdue ? '⚠️ ' : ''}{deadline.toLocaleDateString('uz-UZ')}
                  </p>
                </div>
              </div>

              {/* Timeline */}
              {task.startedAt && (
                <div style={{ textAlign: 'right', fontSize: '12px', color: '#555' }}>
                  <p style={{ margin: '0 0 2px' }}>Boshlandi: {new Date(task.startedAt).toLocaleDateString('uz-UZ')}</p>
                  {task.completedAt && <p style={{ margin: 0, color: '#4ade80' }}>Tugadi: {new Date(task.completedAt).toLocaleDateString('uz-UZ')}</p>}
                </div>
              )}

              {/* Status */}
              <span style={{ background: status.bg, color: status.color, borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                {status.label}
              </span>

              {/* Delete */}
              <button
                onClick={() => handleDelete(task._id)}
                style={{ background: 'transparent', border: '1px solid #3a1a1a', color: '#f87171', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                O'chirish
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#1a1d27', borderRadius: '20px', padding: '32px', width: '440px', border: '1px solid #2a2d3a' }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '22px', fontWeight: 800, margin: '0 0 24px' }}>Yangi vazifa</h2>

            {/* Vazifa nomi */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#888', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Vazifa nomi</label>
              <input
                type="text"
                placeholder="Kesish, Yig'ish, Bo'yash..."
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                style={{ width: '100%', background: '#0f1117', border: '1px solid #2a2d3a', borderRadius: '10px', padding: '12px 16px', color: '#e8e8e8', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Buyurtma tanlash */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#888', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Buyurtma</label>
              <select
                value={form.order}
                onChange={e => setForm(prev => ({ ...prev, order: e.target.value }))}
                style={{ width: '100%', background: '#0f1117', border: '1px solid #2a2d3a', borderRadius: '10px', padding: '12px 16px', color: form.order ? '#e8e8e8' : '#555', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              >
                <option value="">Buyurtma tanlang</option>
                {orders.map(o => <option key={o._id} value={o._id}>{o.title}</option>)}
              </select>
            </div>

            {/* Usta tanlash */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#888', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Usta</label>
              <select
                value={form.worker}
                onChange={e => setForm(prev => ({ ...prev, worker: e.target.value }))}
                style={{ width: '100%', background: '#0f1117', border: '1px solid #2a2d3a', borderRadius: '10px', padding: '12px 16px', color: form.worker ? '#e8e8e8' : '#555', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              >
                <option value="">Usta tanlang</option>
                {workers.map(w => (
                  <option key={w._id} value={w._id}>
                    {w.fullName} {w.telegramChatId ? '✓' : '(Telegram yo\'q)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Muddat */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#888', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Muddat</label>
              <input
                type="date"
                value={form.deadline}
                onChange={e => setForm(prev => ({ ...prev, deadline: e.target.value }))}
                style={{ width: '100%', background: '#0f1117', border: '1px solid #2a2d3a', borderRadius: '10px', padding: '12px 16px', color: '#e8e8e8', fontSize: '14px', outline: 'none', boxSizing: 'border-box', colorScheme: 'dark' }}
              />
            </div>

            {/* Telegram eslatmasi */}
            <div style={{ background: '#14261a', border: '1px solid #1a3a22', borderRadius: '10px', padding: '12px 16px', marginBottom: '24px' }}>
              <p style={{ margin: 0, color: '#4ade80', fontSize: '13px' }}>
                📲 Vazifa yaratilganda usta Telegramga avtomatik xabar oladi
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ flex: 1, background: 'transparent', border: '1px solid #2a2d3a', color: '#888', borderRadius: '10px', padding: '12px', cursor: 'pointer', fontSize: '14px' }}
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                style={{ flex: 1, background: '#f0c040', color: '#0f1117', border: 'none', borderRadius: '10px', padding: '12px', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
              >
                {saving ? 'Yuborilmoqda...' : '📲 Yuborish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}