import { CheckCircle2, Sparkles } from 'lucide-react';
import useAuth from '../hooks/useAuth.jsx';

function Profile() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-[color:var(--hairline)] bg-[color:var(--panel)]/80 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.2)]">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--ember)]">Profile</p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-[color:var(--text)]">Your operations profile</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--text-muted)]">
          Manage the identity and workspace context used to personalize the dashboard.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="rounded-[28px] border border-[color:var(--hairline)] bg-[color:var(--panel)]/80 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--ember-soft)] font-display text-2xl font-semibold text-[color:var(--ember)]">
              {user?.avatar || 'PP'}
            </div>
            <div>
              <p className="font-display text-xl font-semibold text-[color:var(--text)]">{user?.name}</p>
              <p className="mt-1 text-sm text-[color:var(--text-muted)]">{user?.organization}</p>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[color:var(--text-faint)]">Email</p>
              <p className="mt-2 text-base font-medium text-[color:var(--text)]">{user?.email}</p>
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[color:var(--text-faint)]">Role</p>
              <p className="mt-2 text-base font-medium text-[color:var(--text)]">Priority Operations Manager</p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-[color:var(--hairline)] bg-[color:var(--panel)]/80 p-6">
          <div className="flex items-center gap-2 text-[color:var(--text)]">
            <Sparkles className="h-4 w-4 text-[color:var(--ember)]" />
            <h3 className="font-display text-xl font-semibold">Account details</h3>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[color:var(--hairline)] bg-white/[0.03] p-5">
              <p className="text-sm text-[color:var(--text-muted)]">Workspace</p>
              <p className="mt-2 text-base font-semibold text-[color:var(--text)]">Email Ops</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--hairline)] bg-white/[0.03] p-5">
              <p className="text-sm text-[color:var(--text-muted)]">Member since</p>
              <p className="mt-2 text-base font-semibold text-[color:var(--text)]">June 2025</p>
            </div>
          </div>
          <div className="mt-6 rounded-[24px] border border-[color:var(--hairline)] bg-[color:var(--ember-soft)] px-5 py-5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[color:var(--teal)]" />
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[color:var(--ember)]">Account health</p>
            </div>
            <p className="mt-3 text-lg font-semibold text-[color:var(--text)]">Priority workflow configured</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
