import { useEffect, useRef } from 'react';

export default function OtpInput({ value, onChange, disabled }) {
  const refs = useRef([]);
  useEffect(() => { if (value.length === 0) refs.current[0]?.focus(); }, [value.length]);
  const update = (index, next) => {
    const digit = next.replace(/\D/g, '').slice(-1);
    const digits = value.padEnd(6, ' ').split('');
    digits[index] = digit || ' ';
    onChange(digits.join('').replace(/ /g, ''));
    if (digit && index < 5) refs.current[index + 1]?.focus();
  };
  return <div className="flex justify-between gap-2" aria-label="One-time passcode">
    {Array.from({ length: 6 }, (_, index) => <input key={index} ref={(el) => { refs.current[index] = el; }} value={value[index] || ''} onChange={(event) => update(index, event.target.value)} onKeyDown={(event) => { if (event.key === 'Backspace' && !value[index] && index > 0) refs.current[index - 1]?.focus(); }} inputMode="numeric" maxLength={1} disabled={disabled} className="h-12 w-full rounded-xl border border-ink/10 bg-paper/60 text-center text-lg font-semibold text-ink outline-none transition focus:border-cobalt focus:ring-2 focus:ring-cobalt/20" />)}
  </div>;
}
