import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import EmailCard from '../components/EmailCard/index.jsx';
import FilterBar from '../components/FilterBar/index.jsx';
import EmptyState from '../components/EmptyState/index.jsx';
import { recentEmails } from '../utils/dummyData.js';

function Inbox() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('recent');

  const filteredEmails = useMemo(() => {
    const query = search.toLowerCase();
    const items = recentEmails.filter((email) => {
      const matchesSearch = !query || [email.sender, email.subject, email.priority].join(' ').toLowerCase().includes(query);
      const matchesFilter = filter === 'all' || email.priority === filter;
      return matchesSearch && matchesFilter;
    });

    return [...items].sort((a, b) => {
      if (sort === 'priority') {
        const order = { High: 0, Medium: 1, Low: 2 };
        return order[a.priority] - order[b.priority];
      }
      if (sort === 'sender') {
        return a.sender.localeCompare(b.sender);
      }
      return 0;
    });
  }, [filter, search, sort]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-[28px] border border-[color:var(--hairline)] bg-[color:var(--panel)]/80 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.2)]"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--ember)]">Inbox</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-[color:var(--text)]">Message queue overview</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--text-muted)]">
              Browse the latest priority email alerts and review each item before routing the next signal to the right team.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[color:var(--hairline)] bg-[color:var(--ink)]/60 px-3 py-1.5 text-sm text-[color:var(--text-muted)]">
            <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--teal)]" />
            {filteredEmails.length} visible
          </div>
        </div>
        <div className="mt-5">
          <FilterBar searchValue={search} onSearchChange={setSearch} sortValue={sort} onSortChange={setSort} filterValue={filter} onFilterChange={setFilter} />
        </div>
      </motion.div>

      {filteredEmails.length ? (
        <div className="grid gap-4">
          {filteredEmails.map((email) => (
            <EmailCard key={email.id} email={email} />
          ))}
        </div>
      ) : (
        <EmptyState title="No emails match the current view" description="Try widening your search or switching filters to reveal more signals." />
      )}
    </div>
  );
}

export default Inbox;
