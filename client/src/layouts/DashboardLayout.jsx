import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar/index.jsx';
import Sidebar from '../components/Sidebar/index.jsx';

function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobileMenu = () => setMobileOpen(false);

  useEffect(() => {
    if (!mobileOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeMobileMenu();
    };

    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-transparent text-[color:var(--text)]">
      <div className="mx-auto flex max-w-7xl gap-6 px-3 py-3 lg:px-6 lg:py-6">
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.button
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-sm lg:hidden"
                onClick={closeMobileMenu}
                aria-label="Close navigation"
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                className="fixed inset-y-0 left-0 z-40 w-80 max-w-[85vw] p-3 lg:hidden"
              >
                <div className="flex h-full w-full flex-col justify-between rounded-[28px] border border-[color:var(--hairline)]/70 bg-[color:var(--ink)]/95 p-4 shadow-[0_24px_80px_rgba(2,6,23,0.45)]">
                  <div>
                    <div className="relative mb-6 overflow-hidden rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--panel)]/80 px-4 py-5">
                      <svg viewBox="0 0 220 40" className="absolute inset-0 h-full w-full opacity-20 pulse-line" aria-hidden="true">
                        <path d="M0 20 H70 L80 4 L92 36 L104 20 H220" fill="none" stroke="var(--ember)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="relative flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--ember-soft)] font-display text-sm font-bold text-[color:var(--ember)]">
                          PP
                        </div>
                        <div>
                          <p className="font-display text-sm font-semibold text-[color:var(--text)]">PriorityPulse</p>
                          <p className="font-mono text-[11px] text-[color:var(--text-faint)]">ai email intelligence</p>
                        </div>
                      </div>
                    </div>
                    <Sidebar onNavigate={closeMobileMenu} />
                  </div>
                  <div className="rounded-2xl border border-[color:var(--hairline)] bg-gradient-to-br from-[color:var(--ember-soft)] via-transparent to-[color:var(--teal-soft)] p-4">
                    <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[color:var(--ember)]">live insights</p>
                    <p className="mt-3 text-sm font-medium text-[color:var(--text)]">Stay one step ahead of urgent inbox activity.</p>
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <aside className="glass-panel sticky top-3 hidden h-[calc(100vh-1.5rem)] w-72 shrink-0 rounded-[28px] border border-[color:var(--hairline)]/70 p-4 lg:flex">
          <div className="flex h-full w-full flex-col justify-between rounded-[24px] border border-white/10 bg-[color:var(--ink)]/70 p-4">
            <div>
              <div className="relative mb-6 overflow-hidden rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--panel)]/80 px-4 py-5">
                <svg viewBox="0 0 220 40" className="absolute inset-0 h-full w-full opacity-20 pulse-line" aria-hidden="true">
                  <path d="M0 20 H70 L80 4 L92 36 L104 20 H220" fill="none" stroke="var(--ember)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="relative flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--ember-soft)] font-display text-sm font-bold text-[color:var(--ember)]">
                    PP
                  </div>
                  <div>
                    <p className="font-display text-sm font-semibold text-[color:var(--text)]">PriorityPulse</p>
                    <p className="font-mono text-[11px] text-[color:var(--text-faint)]">ai email intelligence</p>
                  </div>
                </div>
              </div>
              <Sidebar />
            </div>

            <div className="rounded-2xl border border-[color:var(--hairline)] bg-gradient-to-br from-[color:var(--ember-soft)] via-transparent to-[color:var(--teal-soft)] p-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[color:var(--ember)]">live insights</p>
              <p className="mt-3 text-sm font-medium text-[color:var(--text)]">Stay one step ahead of urgent inbox activity.</p>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="sticky top-3 z-20 mb-4 rounded-[24px] border border-[color:var(--hairline)]/70 bg-[color:var(--panel)]/80 px-4 py-3 shadow-[0_20px_60px_rgba(2,6,23,0.35)] backdrop-blur-xl lg:px-6 lg:py-4">
            <Navbar onMenuClick={() => setMobileOpen((prev) => !prev)} isMenuOpen={mobileOpen} />
          </div>
          <main className="pb-4 lg:pb-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
