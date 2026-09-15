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
        className={`overflow-hidden rounded-full ${compact ? "h-1.5" : "h-2.5"}`}
        style={{ background: "var(--cp-surface-soft)" }}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={normalized}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            background: "var(--cp-accent)",
            width: `${normalized}%`,
          }}
        />
      </div>
    </div>
  );
}
