'use client';

import { useEffect, useState, useCallback, use } from 'react';
import WorkerPanel from './WorkerPanel';

interface Task {
  _id: string;
  title: string;
  description?: string;
  worker: { _id: string; fullName: string };
  department?: string;
  order?: { _id: string; title: string };
  deadline: string;
  status: 'pending' | 'in_progress' | 'completed';
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

const STATUS_META = {
  pending:     { label: 'Kutilmoqda', text: '#4a9eff', dot: '#4a9eff' },
  in_progress: { label: 'Jarayonda',  text: '#f0a500', dot: '#f0a500' },
  completed:   { label: 'Tugallandi', text: '#00c87a', dot: '#00c87a' },
};

const DEPT_MAP: Record<string, string> = {
  'yigish-sexi': "Yig'ish sexi",
  'boyash-sexi': "Bo'yash sexi",
  'kesish-sexi': "Kesish sexi",
  'ombor':       'Ombor',
  'boshqa':      'Boshqa',
};

function fmtDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtTime() {
  return new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function isOverdue(task: Task) {
  return new Date(task.deadline) < new Date() && task.status !== 'completed';
}

function daysLeft(deadline: string) {
  const diff = new Date(deadline).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function MonitorPage({ params }: { params: Promise<{ department: string }> }) {
  const { department: deptSlug } = use(params);
  const department = DEPT_MAP[deptSlug] ?? decodeURIComponent(deptSlug);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState('');
  const [today, setToday] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [showWorker, setShowWorker] = useState(false);
  const [allWorkers, setAllWorkers] = useState<
    { _id: string; fullName: string; code: string; position?: string }[]
  >([]);

  // Ishchilar ro'yxati — WorkerPanel (kod bilan kirish + vazifa o'tkazish) uchun
  useEffect(() => {
    fetch('/api/workers')
      .then(r => r.json())
      .then(d => setAllWorkers(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks?department=${encodeURIComponent(department)}`);
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
      setLastUpdated(fmtTime());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [department]);

useEffect(() => {
  setTime(fmtTime());
  setToday(new Date().toLocaleDateString('uz-UZ', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }));

  fetchTasks();
  const dataInterval  = setInterval(fetchTasks, 15000); // fallback
  const clockInterval = setInterval(() => setTime(fmtTime()), 1000);

  // SSE ulanish
  const sse = new EventSource(
    `/api/sse?department=${encodeURIComponent(department)}`
  );
  sse.onmessage = (e) => {
    if (e.data === 'connected') return;
    try {
      const msg = JSON.parse(e.data);
      if (msg.type === 'refresh') fetchTasks(); // darhol yangilanadi
    } catch {
      // silent
    }
  };
  sse.onerror = () => sse.close(); // xato bo'lsa polling ishlayveradi

  return () => {
    clearInterval(dataInterval);
    clearInterval(clockInterval);
    sse.close();
  };
}, [fetchTasks, department]);

  const pending    = tasks.filter(t => t.status === 'pending');
  const inProgress = tasks.filter(t => t.status === 'in_progress');
  const completed  = tasks.filter(t => t.status === 'completed');
  const overdue    = tasks.filter(t => isOverdue(t));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Azeret+Mono:wght@300;400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body {
          background: #080b10; color: #e0e8f0;
          font-family: 'Space Grotesk', sans-serif;
          overflow: hidden; height: 100vh; width: 100vw;
        }
        .monitor-root {
          display: flex; flex-direction: column;
          height: 100vh; width: 100vw;
          background: #080b10; position: relative; overflow: hidden;
        }
        .monitor-root::before {
          content: ''; position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
          background-size: 48px 48px; pointer-events: none; z-index: 0;
        }
        .monitor-root::after {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent, #4a9eff 30%, #00c87a 70%, transparent);
          z-index: 10;
        }
        .header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 32px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(8,11,16,0.9); backdrop-filter: blur(12px);
          position: relative; z-index: 2; flex-shrink: 0;
        }
        .header-left { display: flex; flex-direction: column; gap: 2px; }
        .dept-label { font-size: 11px; font-family: 'Azeret Mono', monospace; color: #4a9eff; letter-spacing: 3px; text-transform: uppercase; }
        .dept-name  { font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; line-height: 1; }
        .header-center { display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .clock    { font-family: 'Azeret Mono', monospace; font-size: 36px; font-weight: 300; color: #ffffff; letter-spacing: 4px; line-height: 1; }
        .date-str { font-size: 12px; color: #556070; letter-spacing: 1px; text-transform: capitalize; }
        .header-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
        .stats-strip { display: flex; gap: 12px; flex-wrap: wrap; }
        .stat-pill {
          display: flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px; padding: 6px 14px; font-size: 13px;
        }
        .stat-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .stat-num { font-family: 'Azeret Mono', monospace; font-weight: 600; font-size: 15px; }
        .stat-lbl { color: #556070; font-size: 12px; }
        .update-txt { font-family: 'Azeret Mono', monospace; font-size: 10px; color: #2a3a4a; letter-spacing: 1px; }
        .overdue-banner {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 6px 24px; background: rgba(255,60,60,0.08);
          border-top: 1px solid rgba(255,60,60,0.2);
          font-size: 12px; color: #ff6666; font-family: 'Azeret Mono', monospace;
          letter-spacing: 1px; flex-shrink: 0; position: relative; z-index: 2;
        }
        .columns-wrap {
          display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;
          padding: 16px 24px 20px; flex: 1; min-height: 0;
          position: relative; z-index: 1; overflow: hidden;
        }
        .column { display: flex; flex-direction: column; gap: 10px; min-height: 0; overflow: hidden; }
        .col-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 14px; border-radius: 10px; flex-shrink: 0;
        }
        .col-header-left { display: flex; align-items: center; gap: 8px; }
        .col-dot  { width: 8px; height: 8px; border-radius: 50%; }
        .col-title { font-size: 11px; font-family: 'Azeret Mono', monospace; letter-spacing: 2px; text-transform: uppercase; font-weight: 500; }
        .col-count { font-family: 'Azeret Mono', monospace; font-size: 13px; font-weight: 600; background: rgba(255,255,255,0.08); padding: 2px 9px; border-radius: 20px; }
        .tasks-scroll { display: flex; flex-direction: column; gap: 8px; overflow-y: auto; flex: 1; padding-right: 2px; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.08) transparent; }
        .task-card {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; padding: 14px 16px;
          display: flex; flex-direction: column; gap: 10px;
          transition: border-color 0.2s; flex-shrink: 0;
        }
        .task-card.overdue   { border-color: rgba(255,80,80,0.3); background: rgba(255,40,40,0.04); }
        .task-card.completed-card { opacity: 0.65; }
        .task-top  { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
        .task-title { font-size: 15px; font-weight: 600; color: #ddeeff; line-height: 1.3; flex: 1; }
        .task-desc  { font-size: 12px; color: #445566; line-height: 1.5; }
        .status-badge {
          display: flex; align-items: center; gap: 5px;
          font-size: 10px; font-family: 'Azeret Mono', monospace;
          letter-spacing: 1px; padding: 4px 9px; border-radius: 6px;
          border: 1px solid; white-space: nowrap; flex-shrink: 0;
        }
        .badge-dot  { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
        .task-meta  { display: flex; flex-direction: column; gap: 5px; }
        .meta-row   { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #445566; }
        .meta-icon  { font-size: 11px; width: 14px; text-align: center; flex-shrink: 0; }
        .meta-val   { color: #7a9ab8; font-weight: 500; }
        .meta-val.overdue-txt { color: #ff5555; }
        .meta-val.success-txt { color: #00c87a; }
        .deadline-bar  { height: 2px; border-radius: 2px; background: rgba(255,255,255,0.06); overflow: hidden; margin-top: 2px; }
        .deadline-fill { height: 100%; border-radius: 2px; transition: width 1s linear; }
        .empty-col  { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; opacity: 0.25; }
        .empty-icon { font-size: 32px; }
        .empty-txt  { font-size: 12px; font-family: 'Azeret Mono', monospace; letter-spacing: 2px; }
        .loading-wrap { flex: 1; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 16px; opacity: 0.4; }
        .spinner {
          width: 32px; height: 32px;
          border: 2px solid rgba(74,158,255,0.2); border-top-color: #4a9eff;
          border-radius: 50%; animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        .pulse { animation: pulse-dot 1.5s ease-in-out infinite; }
        .bottom-bar {
          display: flex; align-items: center; justify-content: center;
          padding: 8px 32px; border-top: 1px solid rgba(255,255,255,0.04);
          background: rgba(8,11,16,0.9); flex-shrink: 0; position: relative; z-index: 2;
        }
        .bottom-txt { font-family: 'Azeret Mono', monospace; font-size: 10px; color: #1e2a36; letter-spacing: 2px; text-transform: uppercase; }
        .action-btn {
          margin-top: 4px; width: 100%; padding: 12px; border-radius: 8px;
          font-size: 13px; font-family: 'Azeret Mono', monospace;
          letter-spacing: 2px; cursor: pointer; font-weight: 600;
          transition: opacity 0.15s;
        }
        .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .action-btn:active   { opacity: 0.7; }
      `}</style>

      <div className="monitor-root">
        {/* Header */}
        <div className="header">
          <div className="header-left">
            <span className="dept-label">Bo'lim</span>
            <span className="dept-name">{department}</span>
          </div>
          <div className="header-center">
            <span className="clock">{time}</span>
            <span className="date-str">{today}</span>
          </div>
          <div className="header-right">
            <div className="stats-strip">
              <div className="stat-pill">
                <span className="stat-dot" style={{ background: '#4a9eff' }} />
                <span className="stat-num" style={{ color: '#4a9eff' }}>{pending.length}</span>
                <span className="stat-lbl">kutilmoqda</span>
              </div>
              <div className="stat-pill">
                <span className="stat-dot pulse" style={{ background: '#f0a500' }} />
                <span className="stat-num" style={{ color: '#f0a500' }}>{inProgress.length}</span>
                <span className="stat-lbl">jarayonda</span>
              </div>
              <div className="stat-pill">
                <span className="stat-dot" style={{ background: '#00c87a' }} />
                <span className="stat-num" style={{ color: '#00c87a' }}>{completed.length}</span>
                <span className="stat-lbl">tugallandi</span>
              </div>
            </div>
            {lastUpdated && <span className="update-txt">YANGILANDI: {lastUpdated}</span>}
          </div>
        </div>

        {/* Overdue banner */}
        {overdue.length > 0 && (
          <div className="overdue-banner">
            <span className="pulse">⚠</span>
            <span>{overdue.length} ta vazifa muddati o'tgan</span>
          </div>
        )}

        {/* Main */}
        {loading ? (
          <div className="loading-wrap">
            <div className="spinner" />
            <span style={{ fontFamily: "'Azeret Mono', monospace", fontSize: 11, letterSpacing: 2, color: '#4a9eff' }}>
              YUKLANMOQDA
            </span>
          </div>
        ) : (
          <div className="columns-wrap">
            {/* Pending */}
            <div className="column">
              <div className="col-header" style={{ background: 'rgba(74,158,255,0.06)', border: '1px solid rgba(74,158,255,0.15)' }}>
                <div className="col-header-left">
                  <span className="col-dot" style={{ background: '#4a9eff' }} />
                  <span className="col-title" style={{ color: '#4a9eff' }}>Kutilmoqda</span>
                </div>
                <span className="col-count" style={{ color: '#4a9eff' }}>{pending.length}</span>
              </div>
              <div className="tasks-scroll">
                {pending.length === 0
                  ? <div className="empty-col"><span className="empty-icon">○</span><span className="empty-txt">bo'sh</span></div>
                  : pending.map(task => <TaskCard key={task._id} task={task} />)
                }
              </div>
            </div>

            {/* In Progress */}
            <div className="column">
              <div className="col-header" style={{ background: 'rgba(240,165,0,0.06)', border: '1px solid rgba(240,165,0,0.2)' }}>
                <div className="col-header-left">
                  <span className="col-dot pulse" style={{ background: '#f0a500' }} />
                  <span className="col-title" style={{ color: '#f0a500' }}>Jarayonda</span>
                </div>
                <span className="col-count" style={{ color: '#f0a500' }}>{inProgress.length}</span>
              </div>
              <div className="tasks-scroll">
                {inProgress.length === 0
                  ? <div className="empty-col"><span className="empty-icon">◑</span><span className="empty-txt">bo'sh</span></div>
                  : inProgress.map(task => <TaskCard key={task._id} task={task} />)
                }
              </div>
            </div>

            {/* Completed */}
            <div className="column">
              <div className="col-header" style={{ background: 'rgba(0,200,122,0.05)', border: '1px solid rgba(0,200,122,0.15)' }}>
                <div className="col-header-left">
                  <span className="col-dot" style={{ background: '#00c87a' }} />
                  <span className="col-title" style={{ color: '#00c87a' }}>Tugallandi</span>
                </div>
                <span className="col-count" style={{ color: '#00c87a' }}>{completed.length}</span>
              </div>
              <div className="tasks-scroll">
                {completed.length === 0
                  ? <div className="empty-col"><span className="empty-icon">●</span><span className="empty-txt">bo'sh</span></div>
                  : completed.map(task => <TaskCard key={task._id} task={task} />)
                }
              </div>
            </div>
          </div>
        )}

        {/* Bottom bar */}
        <div className="bottom-bar" style={{ justifyContent: 'space-between' }}>
          <span className="bottom-txt">arko crm · monitor · 15 soniyada yangilanadi</span>
          <button
            onClick={() => setShowWorker(true)}
            style={{
              fontFamily: "'Azeret Mono', monospace", fontSize: 11, letterSpacing: 2,
              color: '#4a9eff', background: 'rgba(74,158,255,0.08)',
              border: '1px solid rgba(74,158,255,0.25)', borderRadius: 8,
              padding: '6px 14px', cursor: 'pointer',
            }}
          >
            🔓 ISHCHI KIRISHI
          </button>
        </div>
      </div>

      {showWorker && (
        <WorkerPanel allWorkers={allWorkers} onClose={() => setShowWorker(false)} />
      )}
    </>
  );
}

// ── Task Card ──
function TaskCard({ task }: { task: Task }) {
  const overdue = isOverdue(task);
  const days    = daysLeft(task.deadline);

  const createdAt  = new Date(task.createdAt).getTime();
  const deadlineAt = new Date(task.deadline).getTime();
  const now        = Date.now();
  const total      = deadlineAt - createdAt;
  const elapsed    = now - createdAt;
  const progress   = Math.min(100, Math.max(0, (elapsed / total) * 100));
  const barColor   = overdue ? '#ff5555' : progress > 75 ? '#f0a500' : '#4a9eff';

  return (
    <div className={`task-card ${overdue ? 'overdue' : ''} ${task.status === 'completed' ? 'completed-card' : ''}`}>
      <div className="task-top">
        <span className="task-title">{task.title}</span>
        <span
          className="status-badge"
          style={{
            color:       STATUS_META[task.status].text,
            borderColor: STATUS_META[task.status].text + '40',
            background:  STATUS_META[task.status].text + '10',
          }}
        >
          <span
            className={`badge-dot ${task.status === 'in_progress' ? 'pulse' : ''}`}
            style={{ background: STATUS_META[task.status].dot }}
          />
          {STATUS_META[task.status].label.toUpperCase()}
        </span>
      </div>

      {task.description && <p className="task-desc">{task.description}</p>}

      <div className="task-meta">
        <div className="meta-row">
          <span className="meta-icon">👷</span>
          <span className="meta-val">{task.worker?.fullName}</span>
        </div>
        {task.order?.title && (
          <div className="meta-row">
            <span className="meta-icon">📦</span>
            <span className="meta-val">{task.order.title}</span>
          </div>
        )}
        <div className="meta-row">
          <span className="meta-icon">⏰</span>
          <span className={`meta-val ${overdue ? 'overdue-txt' : ''}`}>
            {overdue ? `${Math.abs(days)} kun kechikdi` : days === 0 ? 'Bugun!' : `${days} kun qoldi`}
            {' '}· {fmtDate(task.deadline)}
          </span>
        </div>
        {task.startedAt && (
          <div className="meta-row">
            <span className="meta-icon">▶</span>
            <span className="meta-val">Boshlandi: {fmtDate(task.startedAt)}</span>
          </div>
        )}
        {task.completedAt && (
          <div className="meta-row">
            <span className="meta-icon">✓</span>
            <span className="meta-val success-txt">Tugadi: {fmtDate(task.completedAt)}</span>
          </div>
        )}
      </div>

      {task.status !== 'completed' && (
        <div className="deadline-bar">
          <div className="deadline-fill" style={{ width: `${progress}%`, background: barColor }} />
        </div>
      )}
    </div>
  );
}