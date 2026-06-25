'use client';

// Ishchi PWA uchun localStorage'da saqlanadigan auth holati va API yordamchilari.

export type WorkerInfo = {
  _id: string;
  fullName: string;
  phoneNumber: string;
  position?: string | null;
};

const TOKEN_KEY = 'tabel_worker_token';
const WORKER_KEY = 'tabel_worker_info';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getWorker(): WorkerInfo | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(WORKER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as WorkerInfo;
  } catch {
    return null;
  }
}

export function saveSession(token: string, worker: WorkerInfo) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(WORKER_KEY, JSON.stringify(worker));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(WORKER_KEY);
}

// Token bilan API chaqirish (Bearer header avtomatik qo'shiladi)
export async function apiFetch(path: string, init?: RequestInit) {
  const token = getToken();
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });
  return res;
}

// Brauzerdan joriy GPS koordinatasini olish
export function getPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Qurilmangiz GPS-ni qo\'llab-quvvatlamaydi'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error('Joylashuvga ruxsat berilmadi. Sozlamalardan ruxsat bering.'));
        } else {
          reject(new Error('Joylashuvni aniqlab bo\'lmadi. Qaytadan urinib ko\'ring.'));
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}
