import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-xl rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--panel)] p-10 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--ember)]">Page not found</p>
        <h1 className="mt-6 font-display text-4xl font-semibold text-[color:var(--text)]">404 — Route missing</h1>
        <p className="mt-4 text-sm leading-7 text-[color:var(--text-muted)]">
          The page you requested is not available. Return to the dashboard to continue priority monitoring.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex rounded-lg bg-[color:var(--ember)] px-6 py-3 text-sm font-semibold text-[color:var(--ink)] transition hover:brightness-110"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
