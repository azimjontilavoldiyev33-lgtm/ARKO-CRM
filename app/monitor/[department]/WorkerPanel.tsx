'use client';

import { useState, useEffect } from 'react';
import { panelCss } from './_components/panelStyles';
import LoginScreen from './_components/LoginScreen';
import TaskItem from './_components/TaskItem';
import TransferModal from './_components/TransferModal';
import type { Worker, Task, Screen } from './_components/types';

interface WorkerPanelProps {
  onClose: () => void;
  allWorkers: Worker[];
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
    // Faqat kod 4 xonaga to'lganda login — handleLogin'ni qasddan deps'ga qo'shmaymiz.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const otherWorkers = allWorkers.filter(w => w._id !== worker?._id);

  return (
    <>
      <style>{panelCss}</style>

      <div className="wp-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="wp-panel">
          <button className="wp-close" onClick={onClose}>×</button>

          {/* ── LOGIN SCREEN ── */}
          {screen === 'login' && (
            <LoginScreen
              code={code}
              error={error}
              loading={loading}
              onDigit={handleDigit}
              onDelete={handleDelete}
            />
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
                tasks.map(task => (
                  <TaskItem
                    key={task._id}
                    task={task}
                    isLoading={actionLoading === task._id}
                    onStart={handleStart}
                    onComplete={handleComplete}
                    onTransfer={setTransferTask}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── TRANSFER MODAL ── */}
      {transferTask && (
        <TransferModal
          task={transferTask}
          workers={otherWorkers}
          selectedWorker={selectedWorker}
          onSelect={setSelectedWorker}
          onCancel={() => { setTransferTask(null); setSelectedWorker(''); }}
          onConfirm={handleTransfer}
          confirmDisabled={!selectedWorker || actionLoading === transferTask._id}
        />
      )}
    </>
  );
}
