import { Inbox } from 'lucide-react';

function EmptyState({ title, description, action }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[28px] border border-dashed border-[color:var(--hairline)] bg-[color:var(--panel)]/60 px-6 py-10 text-center">
      <div className="rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--ink)]/70 p-4 text-[color:var(--text-muted)]">
        <Inbox className="h-6 w-6" />
      </div>
      <h3 className="mt-5 font-display text-xl font-semibold text-[color:var(--text)]">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-7 text-[color:var(--text-muted)]">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export default EmptyState;
