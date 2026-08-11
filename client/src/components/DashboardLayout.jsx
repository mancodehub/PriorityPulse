import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { BarChart3, Bell, ChevronRight, Inbox, LayoutDashboard, LogOut, Menu, Search, Settings, Star, X } from 'lucide-react';
import PulseMark from './PulseMark.jsx';

const links = [
  { label: 'Priority inbox', to: '/dashboard', icon: Inbox, end: true },
  { label: 'Dashboard', to: '/dashboard/overview', icon: LayoutDashboard, end: true },
  { label: 'High priority', to: '/dashboard/important', icon: Star },
  { label: 'Medium priority', to: '/dashboard/medium', icon: Inbox },
  { label: 'Low priority', to: '/dashboard/low', icon: Inbox },
  { label: 'Analytics', to: '/dashboard/analytics', icon: BarChart3 },
  { label: 'Notifications', to: '/dashboard/notifications', icon: Bell },
  { label: 'Settings', to: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({ children, title }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const signOut = () => { localStorage.removeItem('pp_token'); navigate('/login'); };
  return <div className="pp-app-shell">
    <aside className={`pp-sidebar${open ? ' is-open' : ''}`}>
      <div className="pp-sidebar-brand"><NavLink to="/dashboard" className="brand"><PulseMark /><span>priority<span>pulse</span></span></NavLink><button className="pp-close" onClick={() => setOpen(false)} aria-label="Close menu"><X size={19} /></button></div>
      <p className="pp-sidebar-label">Your workspace</p>
      <nav className="pp-side-nav">{links.map(({ label, to, icon: Icon, end }) => <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}><Icon size={17} /><span>{label}</span><ChevronRight size={14} /></NavLink>)}</nav>
      <div className="pp-sidebar-bottom"><div className="pp-connection"><i /> Gmail connected <span>syncing</span></div><button onClick={signOut}><LogOut size={15} /> Sign out</button></div>
    </aside>
    {open && <button className="pp-scrim" onClick={() => setOpen(false)} aria-label="Close navigation" />}
    <div className="pp-app-main">
      <header className="pp-topbar"><button className="pp-menu" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={21} /></button><div><p className="eyebrow"><span />PriorityPulse workspace</p><h1>{title}</h1></div><div className="pp-top-actions"><label className="pp-search"><Search size={16} /><input placeholder="Search inbox" /><kbd>/</kbd></label><button className="pp-icon-btn" onClick={() => navigate('/dashboard/notifications')} aria-label="Notifications"><Bell size={18} /><i /></button><button className="pp-user" aria-label="User menu"><span>NA</span><b>Naomi Adams</b></button></div></header>
      <main className="pp-content">{children}</main>
    </div>
  </div>;
}
