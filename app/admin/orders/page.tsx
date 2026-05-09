'use client';

import { useEffect, useState } from 'react';

interface Order {
  _id: string;
  title: string;
  clientName: string;
  deadline: string;
  status: 'new' | 'in_progress' | 'completed';
  images: string[];
  createdAt: string;
}

const STATUS_LABELS = {
  new: { label: 'Yangi', color: '#60a5fa', bg: '#1a2a3a' },
  in_progress: { label: 'Jarayonda', color: '#f0c040', bg: '#2a2410' },
  completed: { label: 'Tugallangan', color: '#4ade80', bg: '#142614' },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: '', clientName: '', deadline: '', images: [] as string[] });
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    const res = await fetch('/api/orders');
    const data = await res.json();
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploading(true);

    const uploadedUrls: string[] = [];
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) uploadedUrls.push(data.url);
    }

    setForm(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
    setPreviewImages(prev => [...prev, ...uploadedUrls]);
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.clientName || !form.deadline) return;
    setSaving(true);
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setForm({ title: '', clientName: '', deadline: '', images: [] });
    setPreviewImages([]);
    setShowModal(false);
    setSaving(false);
    fetchOrders();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Buyurtmani o\'chirmoqchimisiz?')) return;
    await fetch(`/api/orders/${id}`, { method: 'DELETE' });
    fetchOrders();
  };

  const removeImage = (index: number) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const stats = {
    total: orders.length,
    new: orders.filter(o => o.status === 'new').length,
    in_progress: orders.filter(o => o.status === 'in_progress').length,
    completed: orders.filter(o => o.status === 'completed').length,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', color: '#e8e8e8', fontFamily: "'DM Sans', sans-serif", padding: '32px' }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
        <div>
          <p style={{ color: '#555', fontSize: '13px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>Mebel CRM</p>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '36px', fontWeight: 800, margin: 0, background: 'linear-gradient(135deg, #fff 0%, #888 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Buyurtmalar
          </h1>
        </div>
        <button onClick={() => setShowModal(true)} style={{ background: '#f0c040', color: '#0f1117', border: 'none', borderRadius: '10px', padding: '12px 24px', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
          + Buyurtma qo'shish
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Jami', value: stats.total, color: '#e8e8e8' },
          { label: 'Yangi', value: stats.new, color: '#60a5fa' },
          { label: 'Jarayonda', value: stats.in_progress, color: '#f0c040' },
          { label: 'Tugallangan', value: stats.completed, color: '#4ade80' },
        ].map((stat, i) => (
          <div key={i} style={{ background: '#1a1d27', borderRadius: '14px', padding: '20px 24px', border: '1px solid #2a2d3a' }}>
            <p style={{ color: '#555', fontSize: '12px', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 8px' }}>{stat.label}</p>
            <p style={{ fontFamily: "'Syne', sans-serif", fontSize: '32px', fontWeight: 800, color: stat.color, margin: 0 }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Orders List */}
      <div style={{ display: 'grid', gap: '12px' }}>
        {loading ? (
          <div style={{ background: '#1a1d27', borderRadius: '16px', padding: '60px', textAlign: 'center', color: '#555' }}>Yuklanmoqda...</div>
        ) : orders.length === 0 ? (
          <div style={{ background: '#1a1d27', borderRadius: '16px', padding: '60px', textAlign: 'center', color: '#555' }}>
            <p style={{ fontSize: '40px', margin: '0 0 12px' }}>📦</p>
            <p>Hali buyurtma qo'shilmagan</p>
          </div>
        ) : orders.map((order) => {
          const status = STATUS_LABELS[order.status];
          const deadline = new Date(order.deadline);
          const isOverdue = deadline < new Date() && order.status !== 'completed';
          return (
            <div key={order._id} style={{ background: '#1a1d27', borderRadius: '16px', padding: '20px 24px', border: `1px solid ${isOverdue ? '#3a1a1a' : '#2a2d3a'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#14161f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>📦</div>
                  <div>
                    <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '15px' }}>{order.title}</p>
                    <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>👤 {order.clientName}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {order.images?.length > 0 && (
                    <button onClick={() => setSelectedOrder(order)} style={{ background: '#1a2a3a', border: 'none', color: '#60a5fa', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', cursor: 'pointer' }}>
                      🖼 {order.images.length} ta rasm
                    </button>
                  )}
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: '0 0 2px', fontSize: '12px', color: '#555' }}>Muddat</p>
                    <p style={{ margin: 0, fontSize: '13px', color: isOverdue ? '#f87171' : '#888' }}>
                      {isOverdue ? '⚠️ ' : ''}{deadline.toLocaleDateString('uz-UZ')}
                    </p>
                  </div>
                  <span style={{ background: status.bg, color: status.color, borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 600 }}>{status.label}</span>
                  <button onClick={() => handleDelete(order._id)} style={{ background: 'transparent', border: '1px solid #3a1a1a', color: '#f87171', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', cursor: 'pointer' }}>O'chirish</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#1a1d27', borderRadius: '20px', padding: '32px', width: '480px', border: '1px solid #2a2d3a', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '22px', fontWeight: 800, margin: '0 0 24px' }}>Yangi buyurtma</h2>

            {[
              { label: 'Buyurtma nomi', key: 'title', placeholder: 'Oshxona garnitury', type: 'text' },
              { label: 'Mijoz ismi', key: 'clientName', placeholder: 'Sardor Rahimov', type: 'text' },
              { label: 'Muddat', key: 'deadline', placeholder: '', type: 'date' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#888', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>{field.label}</label>
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={form[field.key as keyof typeof form] as string}
                  onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                  style={{ width: '100%', background: '#0f1117', border: '1px solid #2a2d3a', borderRadius: '10px', padding: '12px 16px', color: '#e8e8e8', fontSize: '14px', outline: 'none', boxSizing: 'border-box', colorScheme: 'dark' }}
                />
              </div>
            ))}

            {/* Image Upload */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: '#888', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Rasmlar</label>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#0f1117', border: '2px dashed #2a2d3a', borderRadius: '10px', padding: '20px', cursor: 'pointer', color: '#555', fontSize: '14px' }}>
                {uploading ? '⏳ Yuklanmoqda...' : '📸 Rasm qo\'shish'}
                <input type="file" multiple accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploading} />
              </label>

              {previewImages.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '12px' }}>
                  {previewImages.map((url, i) => (
                    <div key={i} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', aspectRatio: '1' }}>
                      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button onClick={() => removeImage(i)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => { setShowModal(false); setPreviewImages([]); setForm({ title: '', clientName: '', deadline: '', images: [] }); }} style={{ flex: 1, background: 'transparent', border: '1px solid #2a2d3a', color: '#888', borderRadius: '10px', padding: '12px', cursor: 'pointer', fontSize: '14px' }}>
                Bekor qilish
              </button>
              <button onClick={handleSubmit} disabled={saving || uploading} style={{ flex: 1, background: '#f0c040', color: '#0f1117', border: 'none', borderRadius: '10px', padding: '12px', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                {saving ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setSelectedOrder(null)}>
          <div style={{ background: '#1a1d27', borderRadius: '20px', padding: '24px', width: '600px', border: '1px solid #2a2d3a' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, margin: 0 }}>{selectedOrder.title} — Rasmlar</h3>
              <button onClick={() => setSelectedOrder(null)} style={{ background: 'transparent', border: 'none', color: '#888', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {selectedOrder.images.map((url, i) => (
                <img key={i} src={url} alt="" style={{ width: '100%', borderRadius: '10px', objectFit: 'cover', aspectRatio: '4/3' }} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}