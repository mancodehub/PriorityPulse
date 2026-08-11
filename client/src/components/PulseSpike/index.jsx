const paths = {
  High: 'M0 12 H10 L14 2 L20 22 L24 12 H34',
  Medium: 'M0 12 H12 L16 6 L20 18 L24 12 H34',
  Low: 'M0 12 H16 L19 9 L22 15 L25 12 H34',
};

const colors = {
  High: 'var(--ember)',
  Medium: 'var(--amber)',
  Low: 'var(--teal)',
};

function PulseSpike({ level = 'Low', className = 'h-5 w-9' }) {
  const d = paths[level] || paths.Low;
  const stroke = colors[level] || colors.Low;

  return (
    <svg viewBox="0 0 34 24" fill="none" className={className} aria-hidden="true">
      <path d={d} stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default PulseSpike;
