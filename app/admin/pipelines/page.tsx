'use client';

import { useEffect, useState } from 'react';

interface Worker {
  _id: string;
  fullName: string;
}

interface Order {
  _id: string;
  title: string;
}

interface Step {
  title: string;
  department: string;
  worker: string;
  deadline: string;
}

const DEPARTMENTS = [
  { label: "Zamer",        slug: 'zamer'        },
  { label: "Roverga",      slug: 'roverga'      },
  { label: "Bazis/Raskroy",slug: 'bazis-raskroy'},
  { label: "Malyarka",     slug: 'malyarka'     },
  { label: "Snabjeniya",   slug: 'snabjeniya'   },
  { label: "Ustanofka",    slug: 'ustanofka'    },
  { label: "Raspil usulga",slug: 'raspil'       },
  { label: "Boshqa",       slug: 'boshqa'       },
];

// Standart zanjir
const DEFAULT_STEPS: Step[] = [
  { title: 'Zamer olish',      department: 'Zamer',         worker: '', deadline: '' },
  { title: 'Roverga yuborish', department: 'Roverga',       worker: '', deadline: '' },
  { title: 'Bazis/Raskroy',    department: 'Bazis/Raskroy', worker: '', deadline: '' },
  { title: 'Malyarka',         department: 'Malyarka',      worker: '', deadline: '' },
  { title: 'Snabjeniya',       department: 'Snabjeniya',    worker: '', deadline: '' },
  { title: 'Ustanofka',        department: 'Ustanofka',     worker: '', deadline: '' },
];

const inputCls = 'w-full bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-4 py-3 text-sm text-[#e8e8e8] outline-none focus:border-[#f0c040] transition placeholder-[#444] [color-scheme:dark]';

export default function PipelinesPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [orders, setOrders]   = useState<Order[]>([]);
  const [title, setTitle]     = useState('');
  const [order, setOrder]     = useState('');
  const [steps, setSteps]     = useState<Step[]>(DEFAULT_STEPS);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState('');
  const [pipelines, setPipelines] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/workers').then(r => r.json()).then(setWorkers);
    fetch('/api/orders').then(r => r.json()).then(setOrders);
    fetch('/api/pipelines').then(r => r.json()).then(setPipelines);
  }, []);

  function updateStep(i: number, key: keyof Step, value: string) {
    setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, [key]: value } : s));
  }

  function addStep() {
    setSteps(prev => [...prev, { title: '', department: '', worker: '', deadline: '' }]);
  }

  function removeStep(i: number) {
    setSteps(prev => prev.filter((_, idx) => idx !== i));
  }

  function moveStep(i: number, dir: -1 | 1) {
    const newSteps = [...steps];
    const temp = newSteps[i];
    newSteps[i] = newSteps[i + dir];
    newSteps[i + dir] = temp;
    setSteps(newSteps);
  }

  async function handleSubmit() {
    if (!title || steps.some(s => !s.title || !s.worker || !s.deadline)) {
      setToast('Barcha maydonlarni to\'ldiring');
      setTimeout(() => setToast(''), 2500);
      return;
    }
    setSaving(true);
    await fetch('/api/pipelines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, order: order || null, steps }),
    });
    setToast('Zanjir yaratildi ✓');
    setTimeout(() => setToast(''), 2500);
    setSaving(false);
    setTitle('');
    setOrder('');
    setSteps(DEFAULT_STEPS);
    fetch('/api/pipelines').then(r => r.json()).then(setPipelines);
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-[#e8e8e8]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');`}</style>

      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#1a1d27] border border-[#2a2d3a] text-white text-sm px-5 py-2.5 rounded-full shadow-xl whitespace-nowrap">
          {toast}
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <p className="text-[#555] text-[11px] uppercase tracking-[2px] mb-1">Tabel</p>
          <h1 className="text-3xl font-extrabold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
            Ish zanjiri
          </h1>
        </div>

        {/* Form */}
        <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-5" style={{ fontFamily: "'Syne', sans-serif" }}>
            Yangi zanjir
          </h2>

          <div className="space-y-4 mb-6">
            {/* Zanjir nomi */}
            <div>
              <label className="block text-[#888] text-[11px] uppercase tracking-widest mb-1.5">Zanjir nomi *</label>
              <input
                type="text"
                placeholder="Krovat buyurtma #123"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className={inputCls}
              />
            </div>

            {/* Buyurtma */}
            <div>
              <label className="block text-[#888] text-[11px] uppercase tracking-widest mb-1.5">Buyurtma (ixtiyoriy)</label>
              <select value={order} onChange={e => setOrder(e.target.value)} className={inputCls}>
                <option value="">Buyurtma tanlang</option>
                {orders.map(o => <option key={o._id} value={o._id}>{o.title}</option>)}
              </select>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3 mb-5">
            <div className="flex items-center justify-between">
              <label className="text-[#888] text-[11px] uppercase tracking-widest">Bosqichlar</label>
              <button
                onClick={addStep}
                className="text-xs text-[#f0c040] border border-[#f0c040]/30 px-3 py-1 rounded-lg hover:bg-[#f0c040]/10 transition"
              >
                + Bosqich qo'shish
              </button>
            </div>

            {steps.map((step, i) => (
              <div key={i} className="bg-[#14161f] rounded-xl p-4 border border-[#2a2d3a]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[#f0c040] text-xs font-bold font-mono">{i + 1}-bosqich</span>
                  <div className="flex gap-2">
                    {i > 0 && (
                      <button onClick={() => moveStep(i, -1)} className="text-[#555] hover:text-white text-xs px-2">↑</button>
                    )}
                    {i < steps.length - 1 && (
                      <button onClick={() => moveStep(i, 1)} className="text-[#555] hover:text-white text-xs px-2">↓</button>
                    )}
                    {steps.length > 1 && (
                      <button onClick={() => removeStep(i)} className="text-red-400 hover:text-red-300 text-xs px-2">✕</button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#555] text-[10px] uppercase tracking-wide mb-1">Vazifa nomi</label>
                    <input
                      type="text"
                      placeholder="Zamer olish"
                      value={step.title}
                      onChange={e => updateStep(i, 'title', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-[#555] text-[10px] uppercase tracking-wide mb-1">Bo'lim</label>
                    <select value={step.department} onChange={e => updateStep(i, 'department', e.target.value)} className={inputCls}>
                      <option value="">Bo'lim tanlang</option>
                      {DEPARTMENTS.map(d => <option key={d.slug} value={d.label}>{d.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#555] text-[10px] uppercase tracking-wide mb-1">Ishchi</label>
                    <select value={step.worker} onChange={e => updateStep(i, 'worker', e.target.value)} className={inputCls}>
                      <option value="">Ishchi tanlang</option>
                      {workers.map(w => <option key={w._id} value={w._id}>{w.fullName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#555] text-[10px] uppercase tracking-wide mb-1">Muddat</label>
                    <input
                      type="date"
                      value={step.deadline}
                      onChange={e => updateStep(i, 'deadline', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-[#f0c040] text-[#0f1117] font-bold text-sm hover:bg-[#d4a832] disabled:opacity-40 transition"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            {saving ? 'Yaratilmoqda...' : '🔗 Zanjir yaratish'}
          </button>
        </div>

        {/* Pipelines list */}
        {pipelines.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
              Faol zanjirlar
            </h2>
            <div className="space-y-3">
              {pipelines.map((p: any) => (
                <div key={p._id} className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-semibold text-sm">{p.title}</h3>
                    <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${
                      p.status === 'completed'
                        ? 'bg-emerald-950/50 text-emerald-400'
                        : 'bg-amber-950/50 text-amber-400'
                    }`}>
                      {p.status === 'completed' ? '✓ Tugallandi' : `${p.currentStep + 1}/${p.steps.length} bosqich`}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 bg-[#2a2d3a] rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-[#f0c040] rounded-full transition-all"
                      style={{ width: `${((p.currentStep + 1) / p.steps.length) * 100}%` }}
                    />
                  </div>

                  {/* Steps */}
                  <div className="flex gap-2 flex-wrap">
                    {p.steps.map((s: any, i: number) => (
                      <span
                        key={i}
                        className={`text-xs px-2.5 py-1 rounded-lg ${
                          i < p.currentStep
                            ? 'bg-emerald-950/50 text-emerald-400'
                            : i === p.currentStep
                            ? 'bg-amber-950/50 text-amber-400'
                            : 'bg-[#14161f] text-[#555]'
                        }`}
                      >
                        {i + 1}. {s.title}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}