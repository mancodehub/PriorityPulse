import { AlertCircle, ArrowDown, Minus } from 'lucide-react';

const icons = { HIGH: AlertCircle, MEDIUM: Minus, LOW: ArrowDown };
export default function PriorityBadge({ priority }) {
  const Icon = icons[priority] || Minus;
  return <span className={`pp-priority pp-priority--${priority.toLowerCase()}`}><Icon size={12} />{priority}</span>;
}
