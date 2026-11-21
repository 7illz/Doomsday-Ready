export function LoadingSpinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-12 text-zinc-400">
      <span
        aria-hidden="true"
        className="h-5 w-5 animate-spin rounded-full border-2 border-gold/30 border-r-gold"
      />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse rounded-2xl border border-white/8 bg-white/[0.035] p-5">
      <div className="h-40 rounded-xl bg-white/[0.06]" />
      <div className="mt-5 h-5 w-2/3 rounded bg-white/[0.08]" />
      <div className="mt-3 h-4 w-1/2 rounded bg-white/[0.05]" />
    </div>
  );
}
