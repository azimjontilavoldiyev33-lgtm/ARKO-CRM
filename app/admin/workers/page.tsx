'use client';

import { useEffect, useState } from 'react';

interface Worker {
  _id: string;
  fullName: string;
  phoneNumber: string;
  telegramChatId?: string;
  position?: string;
  createdAt: string;
}

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ fullName: '', phoneNumber: '', position: '' });
  const [saving, setSaving] = useState(false);

  const fetchWorkers = async () => {
    setLoading(true);
    const res = await fetch('/api/workers');
    const data = await res.json();
    setWorkers(data);
    setLoading(false);
  };

  useEffect(() => { fetchWorkers(); }, []);

  const handleSubmit = async () => {
    if (!form.fullName || !form.phoneNumber) return;
    setSaving(true);
    await fetch('/api/workers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        phoneNumber: form.phoneNumber.replace('+', '').replace(/\s/g, ''),
      }),
    });
    setForm({ fullName: '', phoneNumber: '', position: '' });
    setShowModal(false);
    setSaving(false);
    fetchWorkers();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Ustani o\'chirmoqchimisiz?')) return;
    await fetch(`/api/workers/${id}`, { method: 'DELETE' });
    fetchWorkers();
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', color: '#e8e8e8', fontFamily: "'DM Sans', sans-serif", padding: '32px' }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
        <div>
          <p style={{ color: '#555', fontSize: '13px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>Mebel CRM</p>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '36px', fontWeight: 800, margin: 0, background: 'linear-gradient(135deg, #fff 0%, #888 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Ustalar
          </h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ background: '#f0c040', color: '#0f1117', border: 'none', borderRadius: '10px', padding: '12px 24px', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '14px', cursor: 'pointer', letterSpacing: '0.5px' }}
        >
          + Usta qo'shish
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Jami ustalar', value: workers.length, color: '#f0c040' },
          { label: 'Ulangan (Telegram)', value: workers.filter(w => w.telegramChatId).length, color: '#4ade80' },
          { label: 'Ulanmagan', value: workers.filter(w => !w.telegramChatId).length, color: '#f87171' },
        ].map((stat, i) => (
          <div key={i} style={{ background: '#1a1d27', borderRadius: '14px', padding: '20px 24px', border: '1px solid #2a2d3a' }}>
            <p style={{ color: '#555', fontSize: '12px', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 8px' }}>{stat.label}</p>
            <p style={{ fontFamily: "'Syne', sans-serif", fontSize: '32px', fontWeight: 800, color: stat.color, margin: 0 }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Workers Table */}
      <div style={{ background: '#1a1d27', borderRadius: '16px', border: '1px solid #2a2d3a', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #2a2d3a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: '15px' }}>Barcha ustalar</p>
          <p style={{ margin: 0, color: '#555', fontSize: '13px' }}>{workers.length} ta</p>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#555' }}>Yuklanmoqda...</div>
        ) : workers.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#555' }}>
            <p style={{ fontSize: '40px', margin: '0 0 12px' }}>👷</p>
            <p>Hali usta qo'shilmagan</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#14161f' }}>
                {['Ism', 'Telefon', 'Lavozim', 'Telegram', 'Qo\'shilgan', ''].map((h, i) => (
                  <th key={i} style={{ padding: '12px 24px', textAlign: 'left', color: '#555', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {workers.map((worker, i) => (
                <tr key={worker._id} style={{ borderTop: '1px solid #2a2d3a', transition: 'background 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#1f2235')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `hsl(${i * 47 + 30}, 60%, 30%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: `hsl(${i * 47 + 30}, 60%, 80%)` }}>
                        {worker.fullName[0]}
                      </div>
                      <span style={{ fontWeight: 500 }}>{worker.fullName}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', color: '#888', fontFamily: 'monospace', fontSize: '13px' }}>+{worker.phoneNumber}</td>
                  <td style={{ padding: '16px 24px', color: '#888' }}>{worker.position || '—'}</td>
                  <td style={{ padding: '16px 24px' }}>
                    {worker.telegramChatId ? (
                      <span style={{ background: '#14261a', color: '#4ade80', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', fontWeight: 600 }}>✓ Ulangan</span>
                    ) : (
                      <span style={{ background: '#261414', color: '#f87171', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', fontWeight: 600 }}>✗ Ulanmagan</span>
                    )}
                  </td>
                  <td style={{ padding: '16px 24px', color: '#555', fontSize: '13px' }}>
                    {new Date(worker.createdAt).toLocaleDateString('uz-UZ')}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <button
                      onClick={() => handleDelete(worker._id)}
                      style={{ background: 'transparent', border: '1px solid #3a1a1a', color: '#f87171', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', cursor: 'pointer' }}
                    >
                      O'chirish
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#1a1d27', borderRadius: '20px', padding: '32px', width: '420px', border: '1px solid #2a2d3a' }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '22px', fontWeight: 800, margin: '0 0 24px' }}>Yangi usta</h2>

            {[
              { label: 'Ism familiya', key: 'fullName', placeholder: 'Azim Karimov', type: 'text' },
              { label: 'Telefon raqam', key: 'phoneNumber', placeholder: '+998 97 460 15 20', type: 'text' },
              { label: 'Lavozim', key: 'position', placeholder: 'Duradgor', type: 'text' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#888', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>{field.label}</label>
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={form[field.key as keyof typeof form]}
                  onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                  style={{ width: '100%', background: '#0f1117', border: '1px solid #2a2d3a', borderRadius: '10px', padding: '12px 16px', color: '#e8e8e8', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            ))}

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
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
                {saving ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}