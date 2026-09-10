import { ArrowLeft, Clock3, Reply, Star } from 'lucide-react';
import PriorityBadge from './PriorityBadge.jsx';
import AIInsight from './AIInsight.jsx';

export default function EmailDetail({ email = {}, onBack, aiLoading = false }) {
  const sender = email.sender || 'Unknown Sender';
  const senderEmail = email.senderEmail || email.sender || '';
  const avatarInitials = (
    sender
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((x) => x[0])
      .join('')
      .slice(0, 2) || 'PP'
  ).toUpperCase();
  const displayTime = email.time || email.date || 'Recently';
  const firstName = sender.split(' ')[0] || 'Sender';

  return (
    <section className="pp-detail">
      <button className="pp-back" onClick={onBack}>
        <ArrowLeft size={16} /> Back to inbox
      </button>
      <div className="pp-detail-heading">
        <div>
          <PriorityBadge priority={email.priority || 'MEDIUM'} />
          <h2>{email.subject || '(No subject)'}</h2>
          <p>
            <span className="pp-avatar pp-avatar--small">{avatarInitials}</span>
            <strong>{sender}</strong> {senderEmail ? `<${senderEmail}>` : ''}
          </p>
        </div>
        <div className="pp-detail-actions">
          <button aria-label="Star email">
            <Star size={18} fill={email.important ? 'currentColor' : 'none'} />
          </button>
          <button aria-label="Reply">
            <Reply size={18} />
          </button>
        </div>
      </div>
      <div className="pp-detail-time">
        <Clock3 size={14} /> Received {displayTime} · To Naomi Adams
      </div>
      <div className="pp-detail-grid">
        <article className="pp-message">
          <p>Hi Naomi,</p>
          <p>{email.body || email.preview || 'No message content.'}</p>
          <p>
            Thanks,
            <br />
            {firstName}
          </p>
          <div className="pp-reply-box">
            <span>Reply to {sender}...</span>
            <button className="button button--primary">
              <Reply size={14} /> Reply
            </button>
          </div>
        </article>
        <AIInsight email={email} loading={aiLoading} />
      </div>
    </section>
  );
}

