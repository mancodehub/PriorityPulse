import PulseSpike from '../PulseSpike/index.jsx';

const styles = {
  High: 'text-[color:var(--ember)] bg-[color:var(--ember-soft)]',
  Medium: 'text-[color:var(--amber)] bg-[color:var(--amber-soft)]',
  Low: 'text-[color:var(--teal)] bg-[color:var(--teal-soft)]',
};

function PriorityBadge({ level }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-semibold font-mono uppercase tracking-wider ${
        styles[level] || 'text-[color:var(--text-muted)] bg-white/5'
      }`}
    >
      <PulseSpike level={level} className="h-3.5 w-6" />
      {level}
    </span>
  );
}

export default PriorityBadge;
