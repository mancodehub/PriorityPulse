function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[32px] border border-[color:var(--hairline)] bg-[color:var(--panel)]/80 shadow-[0_30px_80px_rgba(0,0,0,0.35)] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-[color:var(--ember)]/25 via-[color:var(--panel)] to-[color:var(--teal)]/20 p-10 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,107,77,0.22),transparent_45%)]" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-sm text-[color:var(--text)]">
              <span className="h-2 w-2 rounded-full bg-[color:var(--teal)]" />
              AI Copilot ready
            </div>
            <h1 className="mt-8 max-w-md font-display text-3xl font-semibold text-[color:var(--text)]">
              Turn inbox noise into decisive action.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-[color:var(--text-muted)]">
              Prioritize customer signals, cut response delays, and keep your team aligned with a shared intelligence workspace.
            </p>
          </div>
          <div className="relative rounded-3xl border border-white/10 bg-[color:var(--ink)]/50 p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[color:var(--text-faint)]">What you get</p>
            <div className="mt-4 space-y-3 text-sm text-[color:var(--text-muted)]">
              <div className="flex items-center gap-3"><span className="h-2.5 w-2.5 rounded-full bg-[color:var(--ember)]" /> Real-time alert routing</div>
              <div className="flex items-center gap-3"><span className="h-2.5 w-2.5 rounded-full bg-[color:var(--teal)]" /> Explainable priority scoring</div>
              <div className="flex items-center gap-3"><span className="h-2.5 w-2.5 rounded-full bg-[color:var(--amber)]" /> Fast, focused daily briefings</div>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 lg:p-10">
          <div className="mb-8 text-center lg:text-left">
            <div className="mx-auto mb-5 flex h-12 w-24 items-center justify-center lg:mx-0">
              <svg viewBox="0 0 120 32" className="h-8 w-24 pulse-line" aria-hidden="true">
                <path d="M0 16 H36 L44 4 L54 28 L62 16 H120" fill="none" stroke="var(--ember)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--ember)]">PriorityPulse</p>
            <h2 className="mt-4 font-display text-2xl font-semibold text-[color:var(--text)]">Secure access to your command center</h2>
            <p className="mt-3 text-sm text-[color:var(--text-muted)]">Sign in or register to manage your real-time email intelligence workspace.</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
