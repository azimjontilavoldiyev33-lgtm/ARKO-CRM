'use client';

import { useEffect, useState } from 'react';

const inputCls =
  'w-full bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-4 py-3 text-sm text-[#e8e8e8] outline-none focus:border-[#f0c040] transition placeholder-[#444] [color-scheme:dark]';

export default function OfficeLocationPage() {
  const [name, setName] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [radius, setRadius] = useState('100');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [company, setCompany] = useState('');

  const fetchLocation = async () => {
    const res = await fetch('/api/office-location');
    const data = await res.json();
    if (data.success && data.data) {
      setName(data.data.name);
      setLat(String(data.data.lat));
      setLng(String(data.data.lng));
      setRadius(String(data.data.radius));
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage('Geolokatsiya qo\'llab-quvvatlanmaydi ❌');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(String(pos.coords.latitude));
        setLng(String(pos.coords.longitude));
        setMessage('Joylashuv aniqlandi ✅');
      },
      () => setMessage('Joylashuvni aniqlab bo\'lmadi ❌')
    );
  };

  const handleSave = async () => {
    if (!name || !lat || !lng) {
      setMessage('Barcha maydonlarni to\'ldiring ❌');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/office-location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        radius: parseInt(radius),
      }),
    });
    const data = await res.json();
    setMessage(data.success ? 'Saqlandi ✅' : 'Xatolik yuz berdi ❌');
    setLoading(false);
  };

  useEffect(() => {
    fetchLocation();
    fetch('/api/me').then((r) => (r.ok ? r.json() : null)).then((d) => { if (d?.companyName) setCompany(d.companyName); }).catch(() => {});
  }, []);

  const msgOk = message.includes('✅');

  return (
    <div className="min-h-screen bg-[#0f1117] text-[#e8e8e8]" style={{ fontFamily: "var(--font-sans)" }}>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <p className="text-[#f0c040] text-[11px] uppercase tracking-[2px] mb-1">{company || 'Tabel'}</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-br from-white to-[#888] bg-clip-text text-transparent m-0" style={{ fontFamily: "var(--font-display)" }}>
            Ofis hududi
          </h1>
          <p className="text-[#555] text-sm mt-1.5">Geofence — ishchilar shu hudud ichida bo&apos;lsagina check-in qila oladi</p>
        </div>

        {/* Form card */}
        <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] p-5 sm:p-6">
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-[#888] text-[11px] uppercase tracking-widest mb-1.5">Ishxona nomi</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masalan: Bosh sex"
                className={inputCls}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[#888] text-[11px] uppercase tracking-widest mb-1.5">Latitude</label>
                <input
                  type="number"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="41.2995"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-[#888] text-[11px] uppercase tracking-widest mb-1.5">Longitude</label>
                <input
                  type="number"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="69.2401"
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className="block text-[#888] text-[11px] uppercase tracking-widest mb-1.5">Radius (metr)</label>
              <input
                type="number"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className={inputCls}
              />
              <p className="text-[#444] text-xs mt-1.5">Tavsiya: 100–150 m. Kichikroq radius — aniqroq nazorat.</p>
            </div>

            <button
              onClick={getCurrentLocation}
              className="w-full bg-[#0f1117] border border-[#2a2d3a] text-[#aaa] rounded-xl py-3 text-sm font-medium hover:border-[#3a3d4a] hover:text-white transition"
            >
              📍 Hozirgi joylashuvni olish
            </button>

            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-[#f0c040] text-[#0f1117] rounded-xl py-3 text-sm font-bold hover:bg-[#d4a832] disabled:opacity-40 transition"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {loading ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>

            {message && (
              <p className={`text-sm font-medium text-center rounded-xl px-4 py-2.5 ${msgOk ? 'bg-[#142614] text-emerald-400 border border-emerald-800/40' : 'bg-[#2a1414] text-red-400 border border-red-800/40'}`}>
                {message}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
