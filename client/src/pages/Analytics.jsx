import { BarChart3, Bell, CircleDashed, LineChart, PieChart, Sparkles } from 'lucide-react';
import AnalyticsChart from '../components/AnalyticsChart/index.jsx';

const stats = [
  { id: 'a1', title: 'Real-time alerts', value: '3,980', detail: 'Total events processed' },
  { id: 'a2', title: 'Priority precision', value: '91%', detail: 'Classification accuracy' },
  { id: 'a3', title: 'Workflow latency', value: '280ms', detail: 'Average response time' },
];

function Analytics() {
  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-[color:var(--hairline)] bg-[color:var(--panel)]/80 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.2)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--ember)]">Analytics</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-[color:var(--text)]">Priority impact and alert trends</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--text-muted)]">
              Review the latest classification performance and the signal quality behind your inbox operations.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--hairline)] bg-[color:var(--ink)]/60 px-3 py-1.5 text-sm text-[color:var(--text-muted)]">
            <Sparkles className="h-4 w-4 text-[color:var(--ember)]" />
            Performance snapshot
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {stats.map((item) => (
          <div key={item.id} className="rounded-[24px] border border-[color:var(--hairline)] bg-[color:var(--panel)]/80 p-6 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[color:var(--text-muted)]">{item.title}</p>
                <p className="mt-4 font-mono text-3xl font-semibold text-[color:var(--text)]">{item.value}</p>
              </div>
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-[color:var(--text-muted)]">
                {item.id === 'a1' && <BarChart3 className="h-5 w-5" />}
                {item.id === 'a2' && <CircleDashed className="h-5 w-5" />}
                {item.id === 'a3' && <LineChart className="h-5 w-5" />}
              </div>
            </div>
            <p className="mt-5 text-sm text-[color:var(--text-muted)]">{item.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="min-w-0 rounded-[28px] border border-[color:var(--hairline)] bg-[color:var(--panel)]/80 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-[color:var(--text-muted)]">Priority health</p>
              <h3 className="mt-3 font-display text-2xl font-semibold text-[color:var(--text)]">Balanced signal flow</h3>
            </div>
            <PieChart className="h-6 w-6 text-[color:var(--ember)]" />
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--ember-soft)] p-4 text-center">
              <p className="text-sm text-[color:var(--text-muted)]">High</p>
              <p className="mt-2 font-mono text-xl font-semibold text-[color:var(--ember)]">21%</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--amber-soft)] p-4 text-center">
              <p className="text-sm text-[color:var(--text-muted)]">Medium</p>
              <p className="mt-2 font-mono text-xl font-semibold text-[color:var(--amber)]">31%</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--teal-soft)] p-4 text-center">
              <p className="text-sm text-[color:var(--text-muted)]">Low</p>
              <p className="mt-2 font-mono text-xl font-semibold text-[color:var(--teal)]">48%</p>
            </div>
          </div>
          <AnalyticsChart type="pie" />
        </div>

        <div className="min-w-0 rounded-[28px] border border-[color:var(--hairline)] bg-[color:var(--panel)]/80 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-[color:var(--text-muted)]">Alert cadence</p>
              <h3 className="mt-3 font-display text-2xl font-semibold text-[color:var(--text)]">Stable delivery</h3>
            </div>
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--ember-soft)] text-[color:var(--ember)]">
              <Bell className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-6 text-sm leading-7 text-[color:var(--text-muted)]">
            Most alerts are now routed through the priority pipeline with consistent uptime and classification speed.
          </p>
          <div className="mt-8 space-y-4">
            <div className="rounded-2xl border border-[color:var(--hairline)] bg-white/[0.03] p-4">
              <p className="text-sm text-[color:var(--text-muted)]">Alert throughput</p>
              <p className="mt-2 font-mono text-lg font-semibold text-[color:var(--text)]">4.8k / day</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--hairline)] bg-white/[0.03] p-4">
              <p className="text-sm text-[color:var(--text-muted)]">Model drift</p>
              <p className="mt-2 font-mono text-lg font-semibold text-[color:var(--text)]">2.3%</p>
            </div>
          </div>
          <AnalyticsChart type="area" />
        </div>
      </div>

      <div className="min-w-0 rounded-[28px] border border-[color:var(--hairline)] bg-[color:var(--panel)]/80 p-6">
        <AnalyticsChart type="bar" />
      </div>
    </div>
  );
}

export default Analytics;
