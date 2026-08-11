export default function PulseMark({ compact = false }) {
  return (
    <span className={`pulse-mark${compact ? ' pulse-mark--compact' : ''}`} aria-hidden="true">
      <span />
      <i />
      <b />
    </span>
  );
}
