// Worker profil sahifasi uchun umumiy tiplar, konstantalar va helperlar.
// (Sahifa va sub-komponentlar shu yerdan import qiladi.)

export interface Task {
  _id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  deadline: string;
  startedAt?: string;
  completedAt?: string;
  order: { title: string };
  rating?: number;
  completionPhoto?: string;
}

export interface Worker {
  _id: string;
  fullName: string;
  phoneNumber: string;
  position?: string;
  code?: string;
  salary?: number;
  createdAt: string;
  deviceId?: string | null;
  deviceBoundAt?: string | null;
}

export const STATUS_META = {
  pending:     { label: 'Kutilmoqda', badge: 'bg-blue-950 text-blue-400',   dot: 'bg-blue-400'   },
  in_progress: { label: 'Jarayonda',  badge: 'bg-amber-950 text-amber-400', dot: 'bg-amber-400'  },
  completed:   { label: 'Tugallandi', badge: 'bg-emerald-950 text-emerald-400', dot: 'bg-emerald-400' },
} as const;

export const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('uz-UZ') : '—';

export const isOverdue = (task: Task) =>
  new Date(task.deadline) < new Date() && task.status !== 'completed';
