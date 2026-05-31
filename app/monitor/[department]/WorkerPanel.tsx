'use client';

import { useState, useEffect } from 'react';

interface Worker {
  _id: string;
  fullName: string;
  code: string;
  position?: string;
}

interface Task {
  _id: string;
  title: string;
  description?: string;
  department?: string;
  order?: { _id: string; title: string };
  deadline: string;
  status: 'pending' | 'in_progress' | 'completed';
  startedAt?: string;
  completedAt?: string;
  worker: { _id: string; fullName: string };
}

interface WorkerPanelProps {
  onClose: () => void;
  allWorkers: Worker[];
}

type Screen = 'login' | 'tasks';

function fmtDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('uz-UZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function daysLeft(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function WorkerPanel({ onClose, allWorkers }: WorkerPanelProps) {
  const [screen, setScreen] = useState<Screen>('login');
  const [code, setCode] = useState('');
  const [worker, setWorker] = useState<Worker | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [transferTask, setTransferTask] = useState<Task | null>(null);
  const [selectedWorker, setSelectedWorker] = useState('');

  const handleDigit = (d: string) => {
    if (code.length < 4) setCode(prev => prev + d);
  };

  const handleDelete = () => setCode(prev => prev.slice(0, -1));

  const handleLogin = async () => {
    if (code.length !== 4) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/workers/${code}`);
      if (!res.ok) { setError("Kod noto'g'ri"); setCode(''); setLoading(false); return; }
      const data = await res.json();
      setWorker(data);
      await fetchTasks(data._id);
      setScreen('tasks');
    } catch {
      setError('Xato yuz berdi');
      setCode('');
    }
    setLoading(false);
  };

  const fetchTasks = async (workerId: string) => {
    const res = await fetch(`/api/tasks?worker=${workerId}`);
    const data = await res.json();
    setTasks(Array.isArray(data) ? data.filter((t: Task) => t.status !== 'completed') : []);
  };

  const handleStart = async (taskId: string) => {
    setActionLoading(taskId);
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'in_progress', startedAt: new Date() }),
    });
    if (worker) await fetchTasks(worker._id);
    setActionLoading(null);
  };

  const handleComplete = async (taskId: string) => {
    setActionLoading(taskId);
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed', completedAt: new Date() }),
    });
    if (worker) await fetchTasks(worker._id);
    setActionLoading(null);
  };

  const handleTransfer = async () => {
    if (!transferTask || !selectedWorker) return;
    setActionLoading(transferTask._id);
    await fetch(`/api/tasks/${transferTask._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ worker: selectedWorker, status: 'pending', startedAt: null }),
    });
    setTransferTask(null);
    setSelectedWorker('');
    if (worker) await fetchTasks(worker._id);
    setActionLoading(null);
  };

  useEffect(() => {
    if (code.length === 4) handleLogin();
  }, [code]);

  const otherWorkers = allWorkers.filter(w => w._id !== worker?._id);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Azeret+Mono:wght@300;400;500;600;700&family=Unbounded:wght@300;400;600;700&display=swap');

        .wp-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(8px);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Azeret Mono', monospace;
        }

        .wp-panel {
          background: #0a0d14;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          width: 420px;
          max-width: 95vw;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
        }

        .wp-close {
          position: absolute;
          top: 16px; right: 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          color: #556070;
          font-size: 18px;
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all 0.15s;
          z-index: 10;
        }
        .wp-close:hover { background: rgba(255,255,255,0.1); color: white; }

        /* ── Login Screen ── */
        .wp-login { padding: 40px 32px 32px; text-align: center; }

        .wp-login-icon {
          width: 64px; height: 64px;
          background: rgba(74,158,255,0.1);
          border: 1px solid rgba(74,158,255,0.2);
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          font-size: 28px;
          margin: 0 auto 20px;
        }

        .wp-login-title {
          font-family: 'Unbounded', sans-serif;
          font-size: 20px;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 6px;
        }

        .wp-login-sub {
          font-size: 11px;
          color: #445566;
          letter-spacing: 1px;
          margin-bottom: 32px;
        }

        /* Code display */
        .wp-code-display {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin-bottom: 28px;
        }

        .wp-code-dot {
          width: 52px; height: 60px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 28px;
          font-weight: 600;
          color: #4a9eff;
          transition: all 0.15s;
        }

        .wp-code-dot.filled {
          background: rgba(74,158,255,0.08);
          border-color: rgba(74,158,255,0.3);
        }

        /* Numpad */
        .wp-numpad {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-bottom: 16px;
        }

        .wp-num-btn {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          color: #ddeeff;
          font-family: 'Unbounded', sans-serif;
          font-size: 20px;
          font-weight: 400;
          height: 60px;
          cursor: pointer;
          transition: all 0.1s;
          display: flex; align-items: center; justify-content: center;
        }
        .wp-num-btn:hover { background: rgba(74,158,255,0.1); border-color: rgba(74,158,255,0.2); color: #4a9eff; }
        .wp-num-btn:active { transform: scale(0.95); }

        .wp-del-btn {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          color: #556070;
          font-size: 20px;
          height: 60px;
          cursor: pointer;
          transition: all 0.1s;
          display: flex; align-items: center; justify-content: center;
          grid-column: span 1;
        }
        .wp-del-btn:hover { background: rgba(255,80,80,0.08); border-color: rgba(255,80,80,0.2); color: #ff6666; }

        .wp-error {
          color: #ff5555;
          font-size: 11px;
          letter-spacing: 1px;
          margin-top: 8px;
          min-height: 16px;
        }

        .wp-loading-bar {
          height: 2px;
          background: rgba(74,158,255,0.15);
          border-radius: 2px;
          overflow: hidden;
          margin-top: 16px;
        }
        .wp-loading-fill {
          height: 100%;
          background: #4a9eff;
          border-radius: 2px;
          animation: load-sweep 0.8s ease-in-out infinite;
        }
        @keyframes load-sweep {
          0% { width: 0%; margin-left: 0; }
          50% { width: 60%; margin-left: 20%; }
          100% { width: 0%; margin-left: 100%; }
        }

        /* ── Tasks Screen ── */
        .wp-tasks { padding: 24px; }

        .wp-worker-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .wp-avatar {
          width: 44px; height: 44px;
          background: rgba(74,158,255,0.12);
          border: 1px solid rgba(74,158,255,0.25);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Unbounded', sans-serif;
          font-size: 16px;
          font-weight: 600;
          color: #4a9eff;
          flex-shrink: 0;
        }

        .wp-worker-name {
          font-family: 'Unbounded', sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: #ffffff;
        }

        .wp-worker-code {
          font-size: 11px;
          color: #445566;
          letter-spacing: 2px;
          margin-top: 2px;
        }

        .wp-logout {
          margin-left: auto;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px;
          color: #445566;
          font-size: 11px;
          font-family: 'Azeret Mono', monospace;
          padding: 6px 12px;
          cursor: pointer;
          transition: all 0.15s;
          letter-spacing: 1px;
        }
        .wp-logout:hover { border-color: rgba(255,80,80,0.3); color: #ff6666; }

        .wp-tasks-title {
          font-size: 10px;
          color: #334455;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        /* Task item */
        .wp-task-item {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 16px;
          margin-bottom: 10px;
          transition: border-color 0.2s;
        }
        .wp-task-item.overdue { border-color: rgba(255,80,80,0.2); }

        .wp-task-name {
          font-family: 'Unbounded', sans-serif;
          font-size: 13px;
          font-weight: 400;
          color: #ddeeff;
          margin-bottom: 6px;
          line-height: 1.4;
        }

        .wp-task-desc {
          font-size: 11px;
          color: #334455;
          margin-bottom: 10px;
          line-height: 1.5;
        }

        .wp-task-meta {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }

        .wp-meta-chip {
          font-size: 10px;
          color: #445566;
          letter-spacing: 0.5px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .wp-meta-chip.overdue { color: #ff5555; }
        .wp-meta-chip.ok { color: #00c87a; }

        .wp-task-actions {
          display: flex;
          gap: 8px;
        }

        .wp-btn {
          flex: 1;
          height: 38px;
          border-radius: 10px;
          font-family: 'Azeret Mono', monospace;
          font-size: 11px;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.15s;
          display: flex; align-items: center; justify-content: center;
          gap: 6px;
          border: 1px solid;
        }
        .wp-btn:active { transform: scale(0.97); }
        .wp-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .wp-btn-start {
          background: rgba(74,158,255,0.08);
          border-color: rgba(74,158,255,0.25);
          color: #4a9eff;
        }
        .wp-btn-start:hover:not(:disabled) { background: rgba(74,158,255,0.15); }

        .wp-btn-done {
          background: rgba(0,200,122,0.08);
          border-color: rgba(0,200,122,0.25);
          color: #00c87a;
        }
        .wp-btn-done:hover:not(:disabled) { background: rgba(0,200,122,0.15); }

        .wp-btn-transfer {
          background: rgba(240,165,0,0.08);
          border-color: rgba(240,165,0,0.25);
          color: #f0a500;
        }
        .wp-btn-transfer:hover:not(:disabled) { background: rgba(240,165,0,0.15); }

        .wp-empty {
          text-align: center;
          padding: 40px 20px;
          color: #223344;
        }
        .wp-empty-icon { font-size: 36px; margin-bottom: 10px; }
        .wp-empty-txt { font-size: 11px; letter-spacing: 1px; }

        /* Transfer modal */
        .wp-transfer-modal {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .wp-transfer-box {
          background: #0d1117;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 24px;
          width: 340px;
          max-width: 90vw;
        }

        .wp-transfer-title {
          font-family: 'Unbounded', sans-serif;
          font-size: 14px;
          color: #f0a500;
          margin-bottom: 6px;
        }

        .wp-transfer-sub {
          font-size: 10px;
          color: #334455;
          letter-spacing: 1px;
          margin-bottom: 16px;
        }

        .wp-transfer-task-name {
          font-size: 12px;
          color: #ddeeff;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px;
          padding: 10px 12px;
          margin-bottom: 16px;
        }

        .wp-select {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          color: #ddeeff;
          font-family: 'Azeret Mono', monospace;
          font-size: 12px;
          padding: 10px 12px;
          margin-bottom: 16px;
          outline: none;
          appearance: none;
          cursor: pointer;
        }
        .wp-select:focus { border-color: rgba(240,165,0,0.3); }
        .wp-select option { background: #0d1117; }

        .wp-transfer-actions { display: flex; gap: 8px; }

        .wp-btn-cancel {
          flex: 1; height: 40px;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px;
          color: #445566;
          font-family: 'Azeret Mono', monospace;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .wp-btn-cancel:hover { border-color: rgba(255,255,255,0.15); color: #778899; }

        .wp-btn-confirm {
          flex: 1; height: 40px;
          background: rgba(240,165,0,0.1);
          border: 1px solid rgba(240,165,0,0.3);
          border-radius: 10px;
          color: #f0a500;
          font-family: 'Azeret Mono', monospace;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.15s;
          letter-spacing: 1px;
        }
        .wp-btn-confirm:hover:not(:disabled) { background: rgba(240,165,0,0.18); }
        .wp-btn-confirm:disabled { opacity: 0.35; cursor: not-allowed; }

        /* Status badge */
        .wp-status {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 10px;
          padding: 3px 8px;
          border-radius: 6px;
          border: 1px solid;
          margin-bottom: 10px;
        }
        .wp-status-dot { width: 5px; height: 5px; border-radius: 50%; }
      `}</style>

      <div className="wp-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="wp-panel">
          <button className="wp-close" onClick={onClose}>×</button>

          {/* ── LOGIN SCREEN ── */}
          {screen === 'login' && (
            <div className="wp-login">
              <div className="wp-login-icon">🔐</div>
              <div className="wp-login-title">Ishchi kirishi</div>
              <div className="wp-login-sub">4 XONALI KODINGIZNI KIRITING</div>

              {/* Code display */}
              <div className="wp-code-display">
                {[0,1,2,3].map(i => (
                  <div key={i} className={`wp-code-dot ${i < code.length ? 'filled' : ''}`}>
                    {i < code.length ? '•' : ''}
                  </div>
                ))}
              </div>

              {/* Numpad */}
              <div className="wp-numpad">
                {['1','2','3','4','5','6','7','8','9'].map(d => (
                  <button key={d} className="wp-num-btn" onClick={() => handleDigit(d)}>
                    {d}
                  </button>
                ))}
                <div />
                <button className="wp-num-btn" onClick={() => handleDigit('0')}>0</button>
                <button className="wp-del-btn" onClick={handleDelete}>⌫</button>
              </div>

              {error && <div className="wp-error">{error}</div>}
              {loading && (
                <div className="wp-loading-bar">
                  <div className="wp-loading-fill" />
                </div>
              )}
            </div>
          )}

          {/* ── TASKS SCREEN ── */}
          {screen === 'tasks' && worker && (
            <div className="wp-tasks">
              {/* Worker header */}
              <div className="wp-worker-header">
                <div className="wp-avatar">
                  {worker.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="wp-worker-name">{worker.fullName}</div>
                  <div className="wp-worker-code">KOD: #{worker.code}</div>
                </div>
                <button
                  className="wp-logout"
                  onClick={() => { setScreen('login'); setWorker(null); setTasks([]); setCode(''); }}
                >
                  CHIQISH
                </button>
              </div>

              <div className="wp-tasks-title">MENING VAZIFALARIM ({tasks.length})</div>

              {tasks.length === 0 ? (
                <div className="wp-empty">
                  <div className="wp-empty-icon">✓</div>
                  <div className="wp-empty-txt">BARCHA VAZIFALAR BAJARILDI</div>
                </div>
              ) : (
                tasks.map(task => {
                  const overdue = new Date(task.deadline) < new Date() && task.status !== 'completed';
                  const days = daysLeft(task.deadline);
                  const isLoading = actionLoading === task._id;

                  return (
                    <div key={task._id} className={`wp-task-item ${overdue ? 'overdue' : ''}`}>
                      {/* Status */}
                      <div
                        className="wp-status"
                        style={{
                          color: task.status === 'pending' ? '#4a9eff' : '#f0a500',
                          borderColor: task.status === 'pending' ? 'rgba(74,158,255,0.2)' : 'rgba(240,165,0,0.2)',
                          background: task.status === 'pending' ? 'rgba(74,158,255,0.06)' : 'rgba(240,165,0,0.06)',
                        }}
                      >
                        <span
                          className="wp-status-dot"
                          style={{ background: task.status === 'pending' ? '#4a9eff' : '#f0a500' }}
                        />
                        {task.status === 'pending' ? 'KUTILMOQDA' : 'JARAYONDA'}
                      </div>

                      <div className="wp-task-name">{task.title}</div>
                      {task.description && <div className="wp-task-desc">{task.description}</div>}

                      <div className="wp-task-meta">
                        {task.order?.title && (
                          <span className="wp-meta-chip">📦 {task.order.title}</span>
                        )}
                        {task.department && (
                          <span className="wp-meta-chip">🏢 {task.department}</span>
                        )}
                        <span className={`wp-meta-chip ${overdue ? 'overdue' : days <= 1 ? 'ok' : ''}`}>
                          ⏰ {overdue ? `${Math.abs(days)} kun kechikdi` : days === 0 ? 'Bugun!' : `${days} kun qoldi`}
                        </span>
                      </div>

                      <div className="wp-task-actions">
                        {task.status === 'pending' && (
                          <button
                            className="wp-btn wp-btn-start"
                            onClick={() => handleStart(task._id)}
                            disabled={isLoading}
                          >
                            ▶ BOSHLASH
                          </button>
                        )}
                        {task.status === 'in_progress' && (
                          <button
                            className="wp-btn wp-btn-done"
                            onClick={() => handleComplete(task._id)}
                            disabled={isLoading}
                          >
                            ✓ TUGATDIM
                          </button>
                        )}
                        <button
                          className="wp-btn wp-btn-transfer"
                          onClick={() => setTransferTask(task)}
                          disabled={isLoading}
                        >
                          ➡ YUBORISH
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── TRANSFER MODAL ── */}
      {transferTask && (
        <div className="wp-transfer-modal">
          <div className="wp-transfer-box">
            <div className="wp-transfer-title">Keyingi ustaga yuborish</div>
            <div className="wp-transfer-sub">VAZIFANI BOSHQA USTAGA O'TKAZISH</div>
            <div className="wp-transfer-task-name">{transferTask.title}</div>

            <select
              className="wp-select"
              value={selectedWorker}
              onChange={e => setSelectedWorker(e.target.value)}
            >
              <option value="">Usta tanlang...</option>
              {otherWorkers.map(w => (
                <option key={w._id} value={w._id}>
                  {w.fullName} {w.code ? `(#${w.code})` : ''}
                </option>
              ))}
            </select>

            <div className="wp-transfer-actions">
              <button
                className="wp-btn-cancel"
                onClick={() => { setTransferTask(null); setSelectedWorker(''); }}
              >
                Bekor
              </button>
              <button
                className="wp-btn-confirm"
                onClick={handleTransfer}
                disabled={!selectedWorker || actionLoading === transferTask._id}
              >
                YUBORISH →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}