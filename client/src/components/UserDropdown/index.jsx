import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, LogOut, UserCircle2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.jsx';

function UserDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    function handleClick(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={open}
        className="flex items-center gap-3 rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--panel)]/70 px-3 py-2.5 text-left transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--ember)]"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color:var(--ember-soft)] text-sm font-semibold text-[color:var(--ember)]">
          {user?.avatar || 'PP'}
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-medium text-[color:var(--text)]">{user?.name || 'PriorityPulse'}</p>
          <p className="text-xs text-[color:var(--text-faint)]">{user?.email || 'analytics@prioritypulse.com'}</p>
        </div>
        <ChevronDown className="h-4 w-4 shrink-0 text-[color:var(--text-muted)]" />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute right-0 z-20 mt-3 w-56 rounded-[24px] border border-[color:var(--hairline)] bg-[color:var(--panel)]/95 p-2 shadow-[0_20px_50px_rgba(2,6,23,0.35)]"
          >
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate('/profile');
              }}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm text-[color:var(--text-muted)] transition hover:bg-white/[0.04] hover:text-[color:var(--text)]"
            >
              <UserCircle2 className="h-4 w-4" />
              View profile
            </button>
            <button type="button" onClick={handleLogout} className="mt-1 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm text-[color:var(--text-muted)] transition hover:bg-white/[0.04] hover:text-[color:var(--text)]">
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default UserDropdown;
