'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, clearSession, getPosition, getToken, getWorker, type WorkerInfo } from './_lib/store';
import InstallPWAButton from '../_lib/InstallPWAButton';
import NotificationButton from './_lib/NotificationButton';

type AttEvent = {
  _id: string;
  type: 'check-in' | 'check-out';
  timestamp: string;
};

type WorkTask = {
  _id: string;
  title: string;
  description?: string;
  deadline: string;
  status: 'pending' | 'in_progress' | 'completed';
  order?: { title: string } | null;
};

type Toast = { kind: 'ok' | 'err'; text: string } | null;

export default function IshHome() {
  const router = useRouter();
  const [worker, setWorker] = useState<WorkerInfo | null>(null);
  const [events, setEvents] = useState<AttEvent[]>([]);
  const [busy, setBusy] = useState<null | 'in' | 'out'>(null);
  const [loadingReport, setLoadingReport] = useState(true);
  const [toast, setToast] = useState<Toast>(null);
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [taskBusy, setTaskBusy] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    setLoadingReport(true);
    try {
      const res = await apiFetch('/api/mobile/attendance/report');
      if (res.status === 401) {
        clearSession();
        router.replace('/ish/login');
        return;
      }
      const data = await res.json();
      if (data?.success) setEvents(data.data as AttEvent[]);
    } catch {
      /* tarmoq yo'q — jim turamiz */
    } finally {
      setLoadingReport(false);
    }
  }, [router]);

  const loadTasks = useCallback(async () => {
    try {
      const res = await apiFetch('/api/mobile/tasks');
      if (res.status === 401) {
        clearSession();
        router.replace('/ish/login');
        return;
      }
      const data = await res.json();
      if (data?.success) setTasks(data.data as WorkTask[]);
    } catch {
      /* tarmoq yo'q — jim turamiz */
    } finally {
      setLoadingTasks(false);
    }
  }, [router]);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/ish/login');
      return;
    }
    setWorker(getWorker());
    loadReport();
    loadTasks();

    // Admin yangi vazifa bersa / monitorda o'zgarsa — telefonda jonli yangilanadi
    const es = new EventSource('/api/sse');
    es.onmessage = () => loadTasks();
    return () => es.close();
  }, [router, loadReport, loadTasks]);

  const handleTask = async (taskId: string, action: 'start' | 'complete') => {
    setTaskBusy(taskId);
    try {
      const res = await apiFetch(`/api/mobile/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data?.success) {
        showToast({ kind: 'ok', text: action === 'start' ? '▶️ Vazifa boshlandi' : '✅ Vazifa tugatildi' });
        await loadTasks();
      } else {
        showToast({ kind: 'err', text: data?.message || 'Xatolik yuz berdi' });
      }
    } catch {
      showToast({ kind: 'err', text: 'Tarmoq xatosi' });
    } finally {
      setTaskBusy(null);
    }
  };

  // Eng so'nggi hodisa "keldi" bo'lsa — hozir ish joyida (ochiq sessiya)
  const isInside = events.length > 0 && events[0].type === 'check-in';

  const showToast = (t: Toast) => {
    setToast(t);
    if (t) setTimeout(() => setToast(null), 5000);
  };

  const handle = async (type: 'in' | 'out') => {
    setBusy(type);
    showToast(null);
    try {
      const { lat, lng } = await getPosition();
      const path =
        type === 'in'
          ? '/api/mobile/attendance/check-in'
          : '/api/mobile/attendance/check-out';
      const res = await apiFetch(path, {
        method: 'POST',
        body: JSON.stringify({ lat, lng }),
      });
      const data = await res.json();
      if (res.status === 401) {
        clearSession();
        router.replace('/ish/login');
        return;
      }
      if (data?.success) {
        showToast({ kind: 'ok', text: type === 'in' ? '✅ Keldingiz qayd etildi!' : '✅ Ketdingiz qayd etildi!' });
        await loadReport();
      } else {
        showToast({ kind: 'err', text: data?.message || 'Xatolik yuz berdi' });
      }
    } catch (e) {
      showToast({ kind: 'err', text: e instanceof Error ? e.message : 'Xatolik' });
    } finally {
      setBusy(null);
    }
  };

  const logout = () => {
    clearSession();
    router.replace('/ish/login');
  };

  const today = new Date().toDateString();
  const todayEvents = events.filter((e) => new Date(e.timestamp).toDateString() === today);

  return (
    <div style={S.wrap}>
<div aria-hidden style={S.glow} />

      <div style={S.inner}>
        {/* Sarlavha */}
        <header style={S.header}>
          <div>
            <p style={{ margin: 0, color: '#666', fontSize: 13 }}>Assalomu alaykum,</p>
            <h1 style={S.name}>{worker?.fullName || 'Ishchi'}</h1>
            {worker?.position && <p style={{ margin: '2px 0 0', color: '#7a7d8a', fontSize: 13 }}>{worker.position}</p>}
          </div>
          <button onClick={logout} style={S.logout} title="Chiqish">⏻</button>
        </header>

        {/* Holat kartasi */}
        <div style={{ ...S.statusCard, borderColor: isInside ? 'rgba(74,222,128,0.3)' : '#23263a' }}>
          <div aria-hidden style={S.accent} />
          <span style={{ ...S.dot, background: isInside ? '#4ade80' : '#555' }} />
          <span style={{ color: isInside ? '#4ade80' : '#888', fontSize: 15, fontWeight: 600 }}>
            {loadingReport ? 'Yuklanmoqda...' : isInside ? 'Hozir ish joyidasiz' : 'Ish joyidan tashqarida'}
          </span>
        </div>

        {/* Ilovani o'rnatish (faqat o'rnatilmagan bo'lsa ko'rinadi) */}
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center' }}>
          <InstallPWAButton />
        </div>

        {/* Bildirishnomani yoqish (faqat yoqilmagan bo'lsa ko'rinadi) */}
        <NotificationButton />

        {/* Toast */}
        {toast && (
          <div style={{ ...S.toast, ...(toast.kind === 'ok' ? S.toastOk : S.toastErr) }}>{toast.text}</div>
        )}

        {/* Tugmalar */}
        <div style={{ display: 'grid', gap: 14, marginTop: 4 }}>
          <button
            onClick={() => handle('in')}
            disabled={busy !== null || isInside}
            className="big-btn"
            style={{ ...S.bigBtn, ...S.inBtn, opacity: isInside || busy ? 0.45 : 1 }}
          >
            {busy === 'in' ? 'Aniqlanmoqda...' : '📍 KELDIM'}
          </button>
          <button
            onClick={() => handle('out')}
            disabled={busy !== null || !isInside}
            className="big-btn"
            style={{ ...S.bigBtn, ...S.outBtn, opacity: !isInside || busy ? 0.45 : 1 }}
          >
            {busy === 'out' ? 'Aniqlanmoqda...' : '🚪 KETDIM'}
          </button>
        </div>

        {/* Vazifalar */}
        <section style={{ marginTop: 28 }}>
          <h2 style={S.sectionTitle}>
            Vazifalar{tasks.length > 0 && <span style={{ color: '#5a5d6a', fontWeight: 400 }}> · {tasks.length}</span>}
          </h2>
          {loadingTasks ? (
            <p style={S.muted}>Yuklanmoqda...</p>
          ) : tasks.length === 0 ? (
            <p style={S.muted}>Hozircha vazifa yo&apos;q</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {tasks.map((t) => {
                const overdue = new Date(t.deadline) < new Date();
                const inProg = t.status === 'in_progress';
                return (
                  <div key={t._id} style={S.taskCard}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <span style={{ ...S.taskBadge, ...(inProg ? S.badgeProg : S.badgePend) }}>
                        {inProg ? '🛠 Jarayonda' : '⏳ Kutilmoqda'}
                      </span>
                      <span style={{ fontSize: 12, color: overdue ? '#f87171' : '#7a7d8a', fontWeight: overdue ? 600 : 400 }}>
                        {overdue ? '⚠ ' : '📅 '}
                        {new Date(t.deadline).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' })}
                      </span>
                    </div>

                    <p style={{ margin: '10px 0 2px', color: '#fff', fontSize: 15, fontWeight: 600 }}>{t.title}</p>
                    {t.order?.title && <p style={{ margin: 0, color: '#7a7d8a', fontSize: 12 }}>📦 {t.order.title}</p>}
                    {t.description && <p style={{ margin: '6px 0 0', color: '#9aa0ad', fontSize: 13, lineHeight: 1.5 }}>{t.description}</p>}

                    <button
                      onClick={() => handleTask(t._id, inProg ? 'complete' : 'start')}
                      disabled={taskBusy === t._id}
                      className="task-btn"
                      style={{ ...S.taskBtn, ...(inProg ? S.taskBtnDone : S.taskBtnStart), opacity: taskBusy === t._id ? 0.6 : 1 }}
                    >
                      {taskBusy === t._id ? '...' : inProg ? '✓ Tugatish' : '▶ Boshlash'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Bugungi tarix */}
        <section style={{ marginTop: 28 }}>
          <h2 style={S.sectionTitle}>Bugungi qaydlar</h2>
          {loadingReport ? (
            <p style={S.muted}>Yuklanmoqda...</p>
          ) : todayEvents.length === 0 ? (
            <p style={S.muted}>Bugun hali qayd yo'q</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {todayEvents.map((e) => (
                <div key={e._id} style={S.row}>
                  <span style={{ fontSize: 18 }}>{e.type === 'check-in' ? '📍' : '🚪'}</span>
                  <span style={{ color: '#cfd2dc', fontSize: 14, flex: 1 }}>
                    {e.type === 'check-in' ? 'Keldi' : 'Ketdi'}
                  </span>
                  <span style={{ color: '#7a7d8a', fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>
                    {new Date(e.timestamp).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <p style={S.footer}>Tabel — davomat tizimi</p>
      </div>

      <style>{`
        .big-btn:active:not(:disabled) { transform: scale(0.98); }
        .task-btn:active:not(:disabled) { transform: scale(0.98); }
      `}</style>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: {
    minHeight: '100vh',
    background: '#0b0d13',
    fontFamily: "var(--font-sans)",
    position: 'relative',
    overflow: 'hidden',
    padding: '24px 20px calc(24px + env(safe-area-inset-bottom))',
  },
  glow: {
    position: 'absolute',
    top: '-20%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 600,
    height: 400,
    background: 'radial-gradient(circle, rgba(240,192,64,0.10) 0%, rgba(240,192,64,0) 70%)',
    pointerEvents: 'none',
  },
  inner: { width: 460, maxWidth: '100%', margin: '0 auto', position: 'relative', zIndex: 1 },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 },
  name: {
    margin: '2px 0 0',
    fontFamily: "var(--font-display)",
    fontSize: 24,
    fontWeight: 800,
    color: '#fff',
    letterSpacing: '-0.5px',
  },
  logout: {
    background: '#14161f',
    border: '1px solid #23263a',
    color: '#888',
    width: 40,
    height: 40,
    borderRadius: 12,
    fontSize: 18,
    cursor: 'pointer',
    flexShrink: 0,
  },
  statusCard: {
    position: 'relative',
    background: '#14161f',
    border: '1px solid #23263a',
    borderRadius: 16,
    padding: '16px 18px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  accent: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(240,192,64,0.4), transparent)',
  },
  dot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  toast: { borderRadius: 12, padding: '12px 16px', fontSize: 14, marginBottom: 14, fontWeight: 500 },
  toastOk: { background: '#13251a', border: '1px solid #1f5236', color: '#4ade80' },
  toastErr: { background: '#2a1414', border: '1px solid #4a1a1a', color: '#f87171' },
  bigBtn: {
    border: 'none',
    borderRadius: 18,
    padding: '26px 20px',
    fontFamily: "var(--font-display)",
    fontWeight: 800,
    fontSize: 20,
    letterSpacing: '0.5px',
    cursor: 'pointer',
    transition: 'transform 0.1s, opacity 0.15s',
    color: '#0f1117',
  },
  inBtn: { background: 'linear-gradient(135deg, #5ee08a 0%, #2fb866 100%)', boxShadow: '0 10px 30px rgba(47,184,102,0.25)' },
  outBtn: { background: 'linear-gradient(135deg, #f5cf5a 0%, #e6b733 100%)', boxShadow: '0 10px 30px rgba(240,192,64,0.2)' },
  sectionTitle: { fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, color: '#cfd2dc', margin: '0 0 12px' },
  muted: { color: '#5a5d6a', fontSize: 14, margin: 0 },
  taskCard: {
    background: '#14161f',
    border: '1px solid #23263a',
    borderRadius: 16,
    padding: '14px 16px',
  },
  taskBadge: {
    fontSize: 11,
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: 999,
    letterSpacing: '0.3px',
  },
  badgePend: { background: '#1a2333', color: '#9aabbf' },
  badgeProg: { background: '#2a2410', color: '#f0c040' },
  taskBtn: {
    width: '100%',
    marginTop: 12,
    border: 'none',
    borderRadius: 12,
    padding: '12px',
    fontFamily: "var(--font-display)",
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'transform 0.1s, opacity 0.15s',
  },
  taskBtnStart: { background: 'linear-gradient(135deg, #5ee08a 0%, #2fb866 100%)', color: '#0f1117' },
  taskBtnDone: { background: 'linear-gradient(135deg, #f5cf5a 0%, #e6b733 100%)', color: '#0f1117' },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: '#14161f',
    border: '1px solid #1d2030',
    borderRadius: 12,
    padding: '12px 16px',
  },
  footer: { textAlign: 'center', color: '#3a3d4a', fontSize: 12, marginTop: 32 },
};
