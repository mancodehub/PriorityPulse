import { BellRing, SlidersHorizontal, Sparkles } from 'lucide-react';

function Settings() {
  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-[color:var(--hairline)] bg-[color:var(--panel)]/80 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.2)]">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--ember)]">Settings</p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-[color:var(--text)]">Preferences and alert configuration</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--text-muted)]">
          Tune your dashboard experience to match the speed and focus of the team behind the inbox.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[28px] border border-[color:var(--hairline)] bg-[color:var(--panel)]/80 p-6">
          <div className="flex items-center gap-2 text-[color:var(--text)]">
            <BellRing className="h-4 w-4 text-[color:var(--ember)]" />
            <h3 className="font-display text-lg font-semibold">Notification settings</h3>
          </div>
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-[color:var(--hairline)] bg-white/[0.03] p-5">
              <p className="font-medium text-[color:var(--text)]">Email alerts</p>
              <p className="mt-2 text-sm text-[color:var(--text-muted)]">Receive summary alerts for high-priority classification events.</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--hairline)] bg-white/[0.03] p-5">
              <p className="font-medium text-[color:var(--text)]">Realtime updates</p>
              <p className="mt-2 text-sm text-[color:var(--text-muted)]">Enable live channel updates for critical email workflows.</p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-[color:var(--hairline)] bg-[color:var(--panel)]/80 p-6">
          <div className="flex items-center gap-2 text-[color:var(--text)]">
            <SlidersHorizontal className="h-4 w-4 text-[color:var(--teal)]" />
            <h3 className="font-display text-lg font-semibold">Dashboard preferences</h3>
          </div>
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-[color:var(--hairline)] bg-white/[0.03] p-5">
              <p className="font-medium text-[color:var(--text)]">Layout mode</p>
              <p className="mt-2 text-sm text-[color:var(--text-muted)]">Default responsive dashboard with collapsible menu.</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--hairline)] bg-white/[0.03] p-5">
              <p className="font-medium text-[color:var(--text)]">Theme</p>
              <p className="mt-2 text-sm text-[color:var(--text-muted)]">Dark signal-console look, tuned for real-time monitoring.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-[color:var(--hairline)] bg-gradient-to-br from-[color:var(--ember-soft)] to-[color:var(--teal-soft)] p-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[color:var(--ember)]" />
          <p className="font-medium text-[color:var(--text)]">Workspace control center</p>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--text-muted)]">The experience stays responsive and accessible across laptop, tablet, and mobile screens.</p>
      </div>
    </div>
  );
}

export default Settings;
