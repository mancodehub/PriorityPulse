import { LoaderCircle } from 'lucide-react';

function Loader({ label = 'Loading workspace...' }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[28px] border border-[color:var(--hairline)] bg-[color:var(--panel)]/70 px-6 py-10 text-center">
      <div className="animate-spin rounded-full border border-[color:var(--ember)]/20 border-t-[color:var(--ember)] p-3">
        <LoaderCircle className="h-6 w-6 text-[color:var(--ember)]" />
      </div>
      <p className="mt-4 text-sm font-medium text-[color:var(--text)]">{label}</p>
      <p className="mt-2 text-sm text-[color:var(--text-muted)]">Preparing your workspace.</p>
    </div>
  );
}

export default Loader;
