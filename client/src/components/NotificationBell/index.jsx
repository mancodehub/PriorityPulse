import { Bell } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { notifications } from '../../utils/dummyData.js';

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(event) {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Notification center"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text-muted)] hover:text-[color:var(--text)]"
      >
        <Bell className="h-4 w-4" />
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[color:var(--high)] ring-2 ring-[color:var(--surface)]" />
      </button>

      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-[calc(100vw-2rem)] max-w-sm rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-2 shadow-lg">
          <div className="flex items-center justify-between px-2 py-1.5">
            <p className="text-sm font-semibold text-[color:var(--text)]">Notifications</p>
            <span className="text-xs text-[color:var(--text-faint)]">{notifications.length} new</span>
          </div>
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {notifications.map((item) => (
              <div key={item.id} className="rounded-lg px-2 py-2 hover:bg-[color:var(--bg)]">
                <p className="text-sm font-medium text-[color:var(--text)]">{item.title}</p>
                <p className="mt-0.5 text-sm text-[color:var(--text-muted)]">{item.message}</p>
                <p className="mt-1 text-xs text-[color:var(--text-faint)]">{item.time}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default NotificationBell;
