'use client';

import { useEffect, useState } from 'react';

export default function OfficeLocationPage() {
  const [name, setName] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [radius, setRadius] = useState('100');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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
      setMessage('Geolokatsiya qo\'llab-quvvatlanmaydi');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(String(pos.coords.latitude));
        setLng(String(pos.coords.longitude));
        setMessage('Joylashuv aniqlandi ✅');
      },
      () => setMessage('Joylashuvni aniqlab bo\'lmadi')
    );
  };

  const handleSave = async () => {
    if (!name || !lat || !lng) {
      setMessage('Barcha maydonlarni to\'ldiring');
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
  }, []);

  return (
    <div className="p-6 max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Ishxona hududi sozlash</h1>

      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Ishxona nomi</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Masalan: Bosh ofis"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Latitude</label>
          <input
            type="number"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="41.2995"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Longitude</label>
          <input
            type="number"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            placeholder="69.2401"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Radius (metr)</label>
          <input
            type="number"
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <button
          onClick={getCurrentLocation}
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          📍 Hozirgi joylashuvni olish
        </button>

        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saqlanmoqda...' : 'Saqlash'}
        </button>

        {message && (
          <p className="text-sm font-medium text-center">{message}</p>
        )}
      </div>
    </div>
  );
}