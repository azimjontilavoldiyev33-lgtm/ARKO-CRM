'use client';

import { useState } from 'react';
import type { Worker } from './shared';

// Field komponenti modal TASHQARISIDA — aks holda har harfda qayta yaratilib,
// input fokusdan chiqib ketadi.
function EditField({
  label,
  value,
  placeholder,
  icon,
  error,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  icon: string;
  error?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] text-[#555] uppercase tracking-widest font-medium">
        {label}
      </label>
      <div className={`flex items-center gap-3 bg-[#14161f] border rounded-xl px-4 py-3 transition-colors ${
        error ? 'border-red-500/50' : 'border-[#2a2d3a] focus-within:border-[#f0c040]/50'
      }`}>
        <span className="text-base shrink-0">{icon}</span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-white placeholder-[#444] outline-none"
        />
      </div>
      {error && <p className="text-xs text-red-400 pl-1">{error}</p>}
    </div>
  );
}

export default function EditWorkerModal({
  worker,
  onClose,
  onSave,
}: {
  worker: Worker;
  onClose: () => void;
  onSave: (data: Partial<Worker>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    fullName: worker.fullName,
    phoneNumber: worker.phoneNumber,
    position: worker.position ?? '',
    salary: worker.salary != null ? String(worker.salary) : '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = 'Ism kiritish shart';
    if (!form.phoneNumber.trim()) e.phoneNumber = 'Telefon raqam kiritish shart';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    await onSave({
      fullName: form.fullName.trim(),
      phoneNumber: form.phoneNumber.trim(),
      position: form.position.trim() || undefined,
      salary: form.salary ? Number(form.salary) : 0,
    });
    setSaving(false);
  };

  const update = (field: keyof typeof form) => (v: string) => {
    setForm(prev => ({ ...prev, [field]: v }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#1a1d27] rounded-2xl w-full max-w-md border border-[#2a2d3a] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#2a2d3a]">
          <div>
            <h2
              className="text-base font-bold text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Ishchi ma'lumotlarini tahrirlash
            </h2>
            <p className="text-[#555] text-xs mt-0.5">O'zgarishlar darhol saqlanadi</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#2a2d3a] text-[#888] flex items-center justify-center hover:text-white transition text-sm"
          >
            ✕
          </button>
        </div>

        {/* Avatar preview */}
        <div className="px-6 pt-5 flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl bg-[#f0c040] flex items-center justify-center text-[#0f1117] text-lg font-extrabold shrink-0"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {form.fullName.split(' ').map(n => n[0]).slice(0, 2).join('') || '?'}
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-tight">{form.fullName || 'Ism kiritilmagan'}</p>
            <p className="text-xs text-[#555] mt-0.5">{form.position || 'Lavozim belgilanmagan'}</p>
          </div>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4">
          <EditField label="To'liq ism" icon="👤" placeholder="Masalan: Alisher Karimov" value={form.fullName} error={errors.fullName} onChange={update('fullName')} />
          <EditField label="Telefon raqam" icon="📞" placeholder="998901234567" value={form.phoneNumber} error={errors.phoneNumber} onChange={update('phoneNumber')} />
          <EditField label="Lavozim (ixtiyoriy)" icon="💼" placeholder="Masalan: Elektrik" value={form.position} error={errors.position} onChange={update('position')} />
          <EditField label="Oylik maosh (so'm)" icon="💰" placeholder="6000000" value={form.salary} onChange={update('salary')} />
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="py-3 rounded-xl border border-[#2a2d3a] text-[#888] text-sm font-medium hover:bg-[#2a2d3a] transition disabled:opacity-50"
          >
            Bekor qilish
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="py-3 rounded-xl bg-[#f0c040] text-[#0f1117] text-sm font-bold hover:bg-[#d4a832] transition disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {saving ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-[#0f1117]/30 border-t-[#0f1117] animate-spin" />
                Saqlanmoqda...
              </>
            ) : (
              'Saqlash'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
