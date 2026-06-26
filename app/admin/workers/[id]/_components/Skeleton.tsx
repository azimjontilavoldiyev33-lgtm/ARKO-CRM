export default function Skeleton() {
  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
      <div className="space-y-2 text-center">
        <div className="w-12 h-12 rounded-full border-2 border-[#f0c040] border-t-transparent animate-spin mx-auto" />
        <p className="text-[#555] text-sm font-medium" style={{ fontFamily: "var(--font-sans)" }}>
          Yuklanmoqda...
        </p>
      </div>
    </div>
  );
}
