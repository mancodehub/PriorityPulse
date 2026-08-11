import { forwardRef } from 'react';

const variants = {
  primary: 'bg-[color:var(--brand)] text-white hover:brightness-110',
  secondary: 'border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text)] hover:bg-[color:var(--bg)]',
  ghost: 'text-[color:var(--text-muted)] hover:bg-[color:var(--bg)] hover:text-[color:var(--text)]',
  danger: 'border border-[color:var(--high)]/30 bg-[color:var(--high-soft)] text-[color:var(--high)] hover:brightness-95',
};

const Button = forwardRef(function Button(
  { children, className = '', variant = 'secondary', icon: Icon, iconPosition = 'left', type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${variants[variant] || variants.secondary} ${className}`}
      {...props}
    >
      {Icon && iconPosition === 'left' ? <Icon className="h-4 w-4" /> : null}
      {children}
      {Icon && iconPosition === 'right' ? <Icon className="h-4 w-4" /> : null}
    </button>
  );
});

export default Button;
