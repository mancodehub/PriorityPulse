import { BarChart3, LineChart, PieChart } from 'lucide-react';

function AnalyticsChart({ type = 'bar' }) {
  if (type === 'area') {
    return (
      <div className="mt-6 rounded-[24px] border border-[color:var(--hairline)] bg-[color:var(--ink)]/70 p-4 shadow-[0_10px_35px_rgba(2,6,23,0.2)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[color:var(--text-muted)]">Signal trend</p>
            <p className="mt-2 font-display text-lg font-semibold text-[color:var(--text)]">Weekly priority lift</p>
          </div>
          <div className="rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--ember-soft)] p-2 text-[color:var(--ember)]">
            <LineChart className="h-4 w-4" />
          </div>
        </div>
        <svg viewBox="0 0 320 140" className="mt-6 h-40 w-full">
          <defs>
            <linearGradient id="priorityGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,107,77,0.6)" />
              <stop offset="100%" stopColor="rgba(45,212,191,0.4)" />
            </linearGradient>
          </defs>
          <path d="M0 95 C40 78, 65 84, 86 68 S140 48, 168 56 S233 86, 275 62 S305 44, 320 28 L320 140 L0 140 Z" fill="rgba(255,107,77,0.16)" />
          <path d="M0 95 C40 78, 65 84, 86 68 S140 48, 168 56 S233 86, 275 62 S305 44, 320 28" fill="none" stroke="url(#priorityGlow)" strokeWidth="3.2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (type === 'pie') {
    return (
      <div className="mt-6 rounded-[24px] border border-[color:var(--hairline)] bg-[color:var(--ink)]/70 p-4 shadow-[0_10px_35px_rgba(2,6,23,0.2)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[color:var(--text-muted)]">Category mix</p>
            <p className="mt-2 font-display text-lg font-semibold text-[color:var(--text)]">Distribution snapshot</p>
          </div>
          <div className="rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--teal-soft)] p-2 text-[color:var(--teal)]">
            <PieChart className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-6 flex items-center justify-center">
          <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-[16px] border-[color:var(--ember)] border-t-[color:var(--amber)]">
            <div className="absolute inset-3 rounded-full border-[12px] border-[color:var(--teal)] border-r-transparent" />
            <div className="text-center">
              <p className="font-display text-xl font-semibold text-[color:var(--text)]">68%</p>
              <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--text-muted)]">actionable</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-[24px] border border-[color:var(--hairline)] bg-[color:var(--ink)]/70 p-4 shadow-[0_10px_35px_rgba(2,6,23,0.2)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[color:var(--text-muted)]">Response cadence</p>
          <p className="mt-2 font-display text-lg font-semibold text-[color:var(--text)]">Average handling time</p>
        </div>
        <div className="rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--amber-soft)] p-2 text-[color:var(--amber)]">
          <BarChart3 className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-6 flex h-36 items-end gap-3">
        {[42, 68, 54, 81, 74, 90].map((height, index) => (
          <div key={index} className="flex flex-1 flex-col items-center gap-2">
            <div className="w-full rounded-t-xl bg-gradient-to-t from-[color:var(--teal)] to-[color:var(--ember)] shadow-[0_10px_24px_rgba(255,107,77,0.18)]" style={{ height: `${height}%` }} />
            <span className="text-[10px] uppercase tracking-[0.24em] text-[color:var(--text-faint)]">{['M','T','W','T','F','S'][index]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AnalyticsChart;
