import { MailOpen, Star } from 'lucide-react';
import PriorityBadge from './PriorityBadge.jsx';

export default function EmailCard({ email = {}, selected, onSelect }) {
  const senderText = email.sender || 'PP';
  const initials = (
    senderText
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((x) => x[0])
      .join('')
      .slice(0, 2) || 'PP'
  ).toUpperCase();

  const displayTime = email.time || email.date || '';

  return (
    <button
      className={`pp-email-card${selected ? ' is-selected' : ''}${email.unread ? ' is-unread' : ''}`}
      onClick={() => onSelect(email)}
    >
      <span className="pp-avatar">{initials}</span>
      <span className="pp-email-copy">
        <strong>{email.sender || 'Unknown Sender'}</strong>
        <b>{email.subject || '(No subject)'}</b>
        <small>{email.preview || ''}</small>
      </span>
      <span className="pp-email-meta">
        <time>{displayTime}</time>
        <PriorityBadge priority={email.priority || 'MEDIUM'} />
      </span>
      <span className="pp-email-actions">
        {email.important && <Star size={15} fill="currentColor" />}
        {email.unread ? <i /> : <MailOpen size={14} />}
      </span>
    </button>
  );
}

