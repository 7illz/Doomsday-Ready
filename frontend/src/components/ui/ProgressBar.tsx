interface ProgressBarProps {
  value: number;
  max: number;
  label: string;
}

export function ProgressBar({ value, max, label }: ProgressBarProps) {
  const percentage = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4 text-sm">
        <span className="font-medium text-zinc-200">{label}</span>
        <span className="tabular-nums text-zinc-400">
          {value} / {max}
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-white/8"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-crimson to-gold transition-[width] duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
