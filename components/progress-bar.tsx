interface ProgressBarProps {
  value: number;
  label: string;
  compact?: boolean;
}

export function ProgressBar({ value, label, compact = false }: ProgressBarProps) {
  const normalized = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold">{label}</span>
        <span className="muted">{normalized}%</span>
      </div>
      <div
        className={`rpg-progress-track overflow-hidden ${compact ? "h-2" : "h-3"}`}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={normalized}
      >
        <div
          className="rpg-progress-fill h-full transition-all duration-500"
          style={{
            width: `${normalized}%`,
          }}
        />
      </div>
    </div>
  );
}
