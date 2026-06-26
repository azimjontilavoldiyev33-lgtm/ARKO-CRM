'use client';

import { useState } from 'react';

export default function RatingModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (r: number) => void;
}) {
  const [rating, setRating] = useState(5);
  const [hovered, setHovered] = useState(0);
  const display = hovered || rating;

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#1a1d27] rounded-2xl p-7 w-full max-w-sm border border-[#2a2d3a] text-center animate-slide-up">
        <div className="w-8 h-1 bg-[#2a2d3a] rounded-full mx-auto mb-5 sm:hidden" />
        <h2 className="text-lg font-bold text-white mb-1" style={{ fontFamily: "var(--font-display)" }}>
          Ishni baholang
        </h2>
        <p className="text-[#555] text-xs mb-6">Usta bajargan ishning sifatini belgilang</p>

        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="text-3xl transition-all duration-100 hover:scale-110"
              style={{ opacity: star <= display ? 1 : 0.2 }}
            >
              ⭐
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="py-3 rounded-xl border border-[#2a2d3a] text-[#888] text-sm font-medium hover:bg-[#2a2d3a] transition"
          >
            Bekor
          </button>
          <button
            onClick={() => onSave(rating)}
            className="py-3 rounded-xl bg-[#f0c040] text-[#0f1117] text-sm font-bold hover:bg-[#d4a832] transition"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Saqlash
          </button>
        </div>
      </div>
    </div>
  );
}
