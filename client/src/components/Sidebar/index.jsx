import { NavLink, useNavigate } from 'react-router-dom';
import {
  Activity,
  Bell,
  LayoutDashboard,
  LogOut,
  Mail,
  Settings,
  Sparkles,
  User,
} from 'lucide-react';
import useAuth from '../../hooks/useAuth.jsx';

const navigation = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Inbox', to: '/inbox', icon: Mail },
  { label: 'Analytics', to: '/analytics', icon: Activity },
  { label: 'Notifications', to: '/notifications', icon: Bell },
  { label: 'Profile', to: '/profile', icon: User },
  { label: 'Settings', to: '/settings', icon: Settings },
];

function Sidebar({ onNavigate }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    onNavigate?.();
    navigate('/login');
  };

  return (
    <nav className="space-y-2">
      <div className="mb-4 rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--panel)]/70 p-3">
        <div className="flex items-center gap-2 text-[color:var(--text-muted)]">
          <Sparkles className="h-4 w-4 text-[color:var(--ember)]" />
          <span className="text-xs font-semibold uppercase tracking-[0.24em]">Workspace</span>
        </div>
        <p className="mt-2 font-medium text-[color:var(--text)]">Northstar Ops</p>
        <p className="mt-1 text-xs text-[color:var(--text-faint)]">{user?.organization || 'PriorityPulse Ops'}</p>
      </div>

      {navigation.map(({ label, to, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--ember)] ${
              isActive
                ? 'bg-[color:var(--ember-soft)] text-[color:var(--text)] shadow-[0_10px_30px_rgba(255,107,77,0.18)]'
                : 'text-[color:var(--text-muted)] hover:bg-white/[0.04] hover:text-[color:var(--text)]'
            }`
          }
        >
          <Icon className="h-4 w-4" />
          {label}
        </NavLink>
      ))}

      <button
        type="button"
        onClick={handleLogout}
        className="mt-6 flex w-full items-center gap-3 rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--panel)]/70 px-4 py-3 text-sm font-medium text-[color:var(--text-muted)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[color:var(--hairline-soft)] hover:text-[color:var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--ember)]"
      >
        <LogOut className="h-4 w-4" />
        Log out
      </button>
    </nav>
  );
}

export default Sidebar;
