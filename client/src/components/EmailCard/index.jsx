import { Link } from 'react-router-dom';
import PriorityBadge from '../PriorityBadge/index.jsx';

const barColor = {
  High: 'bg-[color:var(--ember)]',
  Medium: 'bg-[color:var(--amber)]',
  Low: 'bg-[color:var(--teal)]',
};

function EmailCard({ email }) {
  return (
    <Link
      to={`/email/${email.id}`}
      className="group flex overflow-hidden rounded-[20px] border border-[color:var(--hairline)] bg-[color:var(--panel)] shadow-[0_10px_35px_rgba(2,6,23,0.16)] transition duration-300 hover:-translate-y-0.5 hover:border-[color:var(--hairline-soft)] hover:bg-[color:var(--panel-raised)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--ember)]"
    >
      <span className={`w-1.5 shrink-0 ${barColor[email.priority] || 'bg-[color:var(--hairline)]'}`} />
      <div className="flex-1 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[color:var(--text)]">{email.sender}</p>
            <p className="mt-1 text-sm text-[color:var(--text-muted)]">{email.subject}</p>
          </div>
          <PriorityBadge level={email.priority} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 font-mono text-xs text-[color:var(--text-faint)]">
          <span>{email.received}</span>
          <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--hairline)] px-2.5 py-1 text-[color:var(--text-muted)] transition group-hover:border-[color:var(--ember)]/40 group-hover:text-[color:var(--text)]">
            view details →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default EmailCard;
