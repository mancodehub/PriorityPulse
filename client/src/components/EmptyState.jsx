import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'No emails yet', message = 'Your inbox is empty. New emails will appear here automatically.', action, icon: Icon = Inbox }) {
  return <div className="pp-state pp-empty-state"><span className="pp-state-icon"><Icon size={21} /></span><h3>{title}</h3><p>{message}</p>{action && <button className="pp-state-action" onClick={action.onClick}>{action.label}</button>}</div>;
}
