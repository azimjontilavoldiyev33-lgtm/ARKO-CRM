// Monitor WorkerPanel uchun umumiy tiplar va helper.

export interface Worker {
  _id: string;
  fullName: string;
  code: string;
  position?: string;
}

export interface Task {
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

export type Screen = 'login' | 'tasks';

export function daysLeft(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
