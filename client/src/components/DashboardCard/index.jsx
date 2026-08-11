function DashboardCard({ title, value, trend, Icon, accent }) {
  const isUp = trend?.trim().startsWith('+');
  const isDown = trend?.trim().startsWith('-');

  return (
    <div className="group rounded-[24px] border border-[color:var(--hairline)] bg-[color:var(--panel)]/85 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[color:var(--hairline-soft)] hover:bg-[color:var(--panel-raised)] hover:shadow-[0_16px_45px_rgba(2,6,23,0.25)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--text-muted)]">{title}</p>
          <p className="mt-3 font-mono text-3xl font-semibold text-[color:var(--text)]">{value}</p>
        </div>
        <div className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${accent}`}>
          {Icon && <Icon className="h-5 w-5" />}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <p
          className={`font-mono text-xs ${
            isUp ? 'text-[color:var(--teal)]' : isDown ? 'text-[color:var(--ember)]' : 'text-[color:var(--text-faint)]'
          }`}
        >
          {trend} vs. last period
        </p>
        <span className="rounded-full border border-[color:var(--hairline)] px-2.5 py-1 text-[10px] uppercase tracking-[0.24em] text-[color:var(--text-faint)]">
          Live
        </span>
      </div>
    </div>
  );
}

export default DashboardCard;
