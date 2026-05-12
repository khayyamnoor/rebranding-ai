'use client';

interface Props {
  value: number;
  total: number;
}

export function ProgressBar({ value, total }: Props) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-muted">
        <span className="uppercase tracking-wider">Progress</span>
        <span>
          {value} / {total} · {pct}%
        </span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
