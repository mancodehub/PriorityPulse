import { Search } from 'lucide-react';

function SearchBar({ value, onChange, placeholder = 'Search priority emails…' }) {
  return (
    <label className="relative block w-full min-w-[220px] max-w-md text-[color:var(--text-faint)] focus-within:text-[color:var(--text)]">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--panel)]/70 py-2.5 pl-11 pr-4 font-mono text-sm text-[color:var(--text)] outline-none transition-all duration-300 placeholder:text-[color:var(--text-faint)] focus:border-[color:var(--ember)]/50 focus:bg-[color:var(--panel)]"
      />
    </label>
  );
}

export default SearchBar;
