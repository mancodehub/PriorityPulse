import { Menu, X } from 'lucide-react';
import SearchBar from '../SearchBar/index.jsx';
import NotificationBell from '../NotificationBell/index.jsx';
import UserDropdown from '../UserDropdown/index.jsx';
import useAuth from '../../hooks/useAuth.jsx';

function Navbar({ onMenuClick, isMenuOpen }) {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center justify-between gap-3 md:justify-start">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[color:var(--text-faint)]">welcome back</p>
          <h1 className="mt-1 font-display text-xl font-semibold text-[color:var(--text)]">
            {user?.name || 'Priority Analyst'}
          </h1>
        </div>
        <button
          type="button"
          onClick={onMenuClick}
          aria-label={isMenuOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={isMenuOpen}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--panel)]/70 text-[color:var(--text-muted)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[color:var(--hairline-soft)] hover:text-[color:var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--ember)] lg:hidden"
        >
          {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar />
        <div className="flex items-center gap-3">
          <NotificationBell />
          <UserDropdown />
        </div>
      </div>
    </div>
  );
}

export default Navbar;
