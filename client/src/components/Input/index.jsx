import { forwardRef } from 'react';

const Input = forwardRef(function Input({ label, icon: Icon, className = '', ...props }, ref) {
  return (
    <label className="block space-y-2">
      {label ? <span className="text-sm font-medium text-[color:var(--text-muted)]">{label}</span> : null}
      <div className="flex items-center gap-3 rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--ink)]/70 px-4 py-3 text-[color:var(--text-muted)] transition-all duration-300 focus-within:border-[color:var(--ember)]/50 focus-within:text-[color:var(--text)]">
        {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
        <input
          ref={ref}
          className={`w-full bg-transparent text-sm text-[color:var(--text)] outline-none placeholder:text-[color:var(--text-faint)] ${className}`}
          {...props}
        />
      </div>
    </label>
  );
});

export default Input;
