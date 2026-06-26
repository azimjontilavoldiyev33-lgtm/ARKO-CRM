import type { Task, Worker } from './types';

export default function TransferModal({
  task,
  workers,
  selectedWorker,
  onSelect,
  onCancel,
  onConfirm,
  confirmDisabled,
}: {
  task: Task;
  workers: Worker[];
  selectedWorker: string;
  onSelect: (v: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  confirmDisabled: boolean;
}) {
  return (
    <div className="wp-transfer-modal">
      <div className="wp-transfer-box">
        <div className="wp-transfer-title">Keyingi ustaga yuborish</div>
        <div className="wp-transfer-sub">VAZIFANI BOSHQA USTAGA O'TKAZISH</div>
        <div className="wp-transfer-task-name">{task.title}</div>

        <select
          className="wp-select"
          value={selectedWorker}
          onChange={e => onSelect(e.target.value)}
        >
          <option value="">Usta tanlang...</option>
          {workers.map(w => (
            <option key={w._id} value={w._id}>
              {w.fullName} {w.code ? `(#${w.code})` : ''}
            </option>
          ))}
        </select>

        <div className="wp-transfer-actions">
          <button className="wp-btn-cancel" onClick={onCancel}>
            Bekor
          </button>
          <button
            className="wp-btn-confirm"
            onClick={onConfirm}
            disabled={confirmDisabled}
          >
            YUBORISH →
          </button>
        </div>
      </div>
    </div>
  );
}
