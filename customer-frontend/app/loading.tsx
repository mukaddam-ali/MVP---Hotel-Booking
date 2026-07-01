export default function Loading() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-[#0f2a47]/20 border-t-[#0f2a47] rounded-full animate-spin" />
        <p className="text-sm text-gray-400 tracking-widest uppercase">Loading…</p>
      </div>
    </div>
  );
}
