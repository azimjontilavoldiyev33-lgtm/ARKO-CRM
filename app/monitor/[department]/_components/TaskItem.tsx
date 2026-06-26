import { daysLeft, type Task } from './types';

export default function TaskItem({
  task,
  isLoading,
  onStart,
  onComplete,
  onTransfer,
}: {
  task: Task;
  isLoading: boolean;
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
  onTransfer: (task: Task) => void;
}) {
  const overdue = new Date(task.deadline) < new Date() && task.status !== 'completed';
  const days = daysLeft(task.deadline);

  return (
    <div className={`wp-task-item ${overdue ? 'overdue' : ''}`}>
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
            onClick={() => onStart(task._id)}
            disabled={isLoading}
          >
            ▶ BOSHLASH
          </button>
        )}
        {task.status === 'in_progress' && (
          <button
            className="wp-btn wp-btn-done"
            onClick={() => onComplete(task._id)}
            disabled={isLoading}
          >
            ✓ TUGATDIM
          </button>
        )}
        <button
          className="wp-btn wp-btn-transfer"
          onClick={() => onTransfer(task)}
          disabled={isLoading}
        >
          ➡ YUBORISH
        </button>
      </div>
    </div>
  );
}
