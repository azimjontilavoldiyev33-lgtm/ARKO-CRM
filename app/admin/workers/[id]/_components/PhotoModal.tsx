import type { Task } from './shared';

export default function PhotoModal({ task, onClose }: { task: Task; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1d27] rounded-2xl p-5 w-full max-w-lg border border-[#2a2d3a]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
            {task.title}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#2a2d3a] text-[#888] flex items-center justify-center hover:text-white transition"
          >
            ✕
          </button>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/telegram/photo?file=${encodeURIComponent(task.completionPhoto || '')}`}
          alt="Ish rasmi"
          className="w-full rounded-xl object-cover"
        />
      </div>
    </div>
  );
}
