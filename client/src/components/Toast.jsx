import { Check, X } from 'lucide-react';
import { useEffect } from 'react';

export default function Toast({ message, onClose, duration = 3200 }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, message, onClose]);

  if (!message) return null;
  return <div className="pp-toast" role="status" aria-live="polite"><span><Check size={15} /></span><p>{message}</p><button onClick={onClose} aria-label="Dismiss notification"><X size={15} /></button></div>;
}
