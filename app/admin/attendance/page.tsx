'use client';

import { useEffect, useState } from 'react';

interface Worker {
  _id: string;
  fullName: string;
  phoneNumber: string;
  position?: string;
}

interface AttendanceRecord {
  worker: Worker;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  duration: string | null;
}

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [workerId, setWorkerId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchWorkers = async () => {
    const res = await fetch('/api/workers');
    const data = await res.json();
    if (data.success) setWorkers(data.data);
  };

  const fetchRecords = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (workerId) params.append('workerId', workerId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const res = await fetch(`/api/attendance/report?${params.toString()}`);
    const data = await res.json();
    if (data.success) setRecords(data.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchWorkers();
    fetchRecords();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Davomat hisoboti</h1>

      {/* Filterlar */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <select
          value={workerId}
          onChange={(e) => setWorkerId(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">Barcha ishchilar</option>
          {workers.map((w) => (
            <option key={w._id} value={w._id}>
              {w.fullName}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border rounded px-3 py-2"
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border rounded px-3 py-2"
        />

        <button
          onClick={fetchRecords}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Qidirish
        </button>
      </div>

      {/* Jadval */}
      {loading ? (
        <p>Yuklanmoqda...</p>
      ) : (
        <table className="w-full border-collapse border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-4 py-2 text-left">Ishchi</th>
              <th className="border px-4 py-2 text-left">Sana</th>
              <th className="border px-4 py-2 text-left">Keldi</th>
              <th className="border px-4 py-2 text-left">Ketdi</th>
              <th className="border px-4 py-2 text-left">Ish vaqti</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-4 text-gray-500">
                  Ma'lumot topilmadi
                </td>
              </tr>
            ) : (
              records.map((record, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border px-4 py-2">
                    <p className="font-medium">{record.worker?.fullName}</p>
                    <p className="text-sm text-gray-500">{record.worker?.position}</p>
                  </td>
                  <td className="border px-4 py-2">{record.date}</td>
                  <td className="border px-4 py-2 text-green-600">
                    {record.checkIn
                      ? new Date(record.checkIn).toLocaleTimeString('uz-UZ')
                      : '—'}
                  </td>
                  <td className="border px-4 py-2 text-red-600">
                    {record.checkOut
                      ? new Date(record.checkOut).toLocaleTimeString('uz-UZ')
                      : '—'}
                  </td>
                  <td className="border px-4 py-2">{record.duration ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}