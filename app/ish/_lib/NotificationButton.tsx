'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from './store';

// base64url (VAPID public key) -> Uint8Array (PushManager talab qiladi)
function urlB64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

type State = 'unsupported' | 'default' | 'granted' | 'denied' | 'busy';

// "Bildirishnomani yoqish" tugmasi. Ruxsat so'raydi, push'ga obuna bo'ladi va
// obunani serverga yuboradi. Ruxsat berilgan bo'lsa tugma yashirinadi.
export default function NotificationButton() {
  const [state, setState] = useState<State>('default');

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('Notification' in window) ||
      !('serviceWorker' in navigator) ||
      !('PushManager' in window)
    ) {
      setState('unsupported');
      return;
    }
    setState(Notification.permission as State);
    if (Notification.permission === 'granted') subscribe(true); // obunani jim sinxronlash
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function subscribe(silent = false) {
    try {
      if (!silent) setState('busy');
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setState(perm as State);
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const { publicKey } = await fetch('/api/mobile/push/vapid').then((r) => r.json());
      if (!publicKey) {
        setState('unsupported');
        return;
      }
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlB64ToUint8Array(publicKey) as BufferSource,
        });
      }
      await apiFetch('/api/mobile/push/subscribe', { method: 'POST', body: JSON.stringify(sub) });
      setState('granted');
    } catch {
      if (!silent) setState('default');
    }
  }

  if (state === 'unsupported' || state === 'granted') return null;

  if (state === 'denied') {
    return (
      <p style={{ margin: '12px 0 0', fontSize: 12, color: '#7a7d8a', textAlign: 'center' }}>
        🔕 Bildirishnomalar bloklangan — telefon sozlamalaridan ruxsat bering.
      </p>
    );
  }

  return (
    <button
      onClick={() => subscribe()}
      disabled={state === 'busy'}
      style={{
        width: '100%',
        marginTop: 14,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        background: '#14161f',
        border: '1px solid #23263a',
        color: '#f0c040',
        borderRadius: 12,
        padding: '12px',
        fontSize: 14,
        fontWeight: 600,
        fontFamily: 'var(--font-display)',
        cursor: state === 'busy' ? 'default' : 'pointer',
        opacity: state === 'busy' ? 0.6 : 1,
      }}
    >
      🔔 {state === 'busy' ? 'Yoqilmoqda...' : 'Bildirishnomani yoqish'}
    </button>
  );
}
