import { motion } from 'framer-motion';
import { BellRing, Sparkles } from 'lucide-react';
import { notifications } from '../utils/dummyData.js';

function Notifications() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-[28px] border border-[color:var(--hairline)] bg-[color:var(--panel)]/80 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.2)]"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--ember)]">Notifications</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-[color:var(--text)]">Recent alert activity</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--text-muted)]">
              See the latest system updates, classification events, and alert signals in one feed.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--hairline)] bg-[color:var(--ink)]/60 px-3 py-1.5 text-sm text-[color:var(--text-muted)]">
            <BellRing className="h-4 w-4 text-[color:var(--ember)]" />
            Live feed
          </div>
        </div>
      </motion.div>

      <div className="grid gap-4">
        {notifications.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.05 }}
            className="rounded-[24px] border border-[color:var(--hairline)] bg-[color:var(--panel)]/80 p-6 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-2xl bg-[color:var(--ember-soft)] p-2 text-[color:var(--ember)]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-[color:var(--text)]">{item.title}</p>
                  <p className="mt-1 text-sm text-[color:var(--text-muted)]">{item.message}</p>
                </div>
              </div>
              <span className="rounded-full border border-[color:var(--hairline)] bg-[color:var(--ink)]/60 px-3 py-2 text-xs font-semibold text-[color:var(--text-faint)]">
                {item.time}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default Notifications;
