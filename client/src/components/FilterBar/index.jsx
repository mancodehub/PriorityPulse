import { Filter, Search, SlidersHorizontal, X } from 'lucide-react';

function FilterBar({ searchValue, onSearchChange, sortValue, onSortChange, filterValue, onFilterChange }) {
  const hasActiveFilters = Boolean(searchValue) || filterValue !== 'all' || sortValue !== 'recent';

  const handleReset = () => {
    onSearchChange?.('');
    onFilterChange?.('all');
    onSortChange?.('recent');
  };

  return (
    <div className="flex flex-col gap-3 rounded-[24px] border border-[color:var(--hairline)] bg-[color:var(--ink)]/60 p-3 sm:flex-row sm:items-center">
      <label className="flex flex-1 items-center gap-2 rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--panel)]/70 px-3 py-2.5 text-sm text-[color:var(--text-muted)] focus-within:border-[color:var(--ember)]/50">
        <Search className="h-4 w-4 shrink-0" />
        <input
          value={searchValue}
          onChange={(event) => onSearchChange?.(event.target.value)}
          placeholder="Search mailbox"
          className="w-full bg-transparent outline-none placeholder:text-[color:var(--text-faint)]"
        />
      </label>
      <div className="flex flex-wrap gap-3 sm:flex-nowrap sm:items-center">
        <label className="flex items-center gap-2 rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--panel)]/70 px-3 py-2.5 text-sm text-[color:var(--text-muted)]">
          <Filter className="h-4 w-4 shrink-0" />
          <select value={filterValue} onChange={(event) => onFilterChange?.(event.target.value)} className="bg-transparent outline-none">
            <option value="all" className="bg-[color:var(--ink)]">All priorities</option>
            <option value="High" className="bg-[color:var(--ink)]">High</option>
            <option value="Medium" className="bg-[color:var(--ink)]">Medium</option>
            <option value="Low" className="bg-[color:var(--ink)]">Low</option>
          </select>
        </label>
        <label className="flex items-center gap-2 rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--panel)]/70 px-3 py-2.5 text-sm text-[color:var(--text-muted)]">
          <SlidersHorizontal className="h-4 w-4 shrink-0" />
          <select value={sortValue} onChange={(event) => onSortChange?.(event.target.value)} className="bg-transparent outline-none">
            <option value="recent" className="bg-[color:var(--ink)]">Newest first</option>
            <option value="priority" className="bg-[color:var(--ink)]">Priority</option>
            <option value="sender" className="bg-[color:var(--ink)]">Sender</option>
          </select>
        </label>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl border border-[color:var(--hairline)] px-3 py-2.5 text-sm text-[color:var(--text-faint)] transition hover:text-[color:var(--text)]"
          >
            <X className="h-3.5 w-3.5" />
            Reset
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default FilterBar;
