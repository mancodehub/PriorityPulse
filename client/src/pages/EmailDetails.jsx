import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Archive, ArrowLeft, BrainCircuit, Check, Clock3, MailOpen, Star, Tag, Trash2, TrendingUp } from 'lucide-react';
import { recentEmails } from '../utils/dummyData.js';
import PriorityBadge from '../components/PriorityBadge/index.jsx';
import Button from '../components/Button/index.jsx';
import Modal from '../components/Modal/index.jsx';

function EmailDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const email = useMemo(() => recentEmails.find((item) => item.id === id), [id]);

  const [isRead, setIsRead] = useState(true);
  const [isStarred, setIsStarred] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!email) {
    return (
      <div className="rounded-[28px] border border-[color:var(--hairline)] bg-[color:var(--panel)]/80 p-10 text-center">
        <p className="text-sm font-semibold text-[color:var(--text)]">Email not found</p>
        <p className="mt-2 text-sm text-[color:var(--text-muted)]">Return to the inbox to select another message.</p>
      </div>
    );
  }

  const handleDelete = () => {
    setConfirmDelete(false);
    navigate('/inbox');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--panel)]/80 px-4 py-2 text-sm text-[color:var(--text-muted)] transition-all duration-300 hover:-translate-y-0.5 hover:text-[color:var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--ember)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to inbox
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={isRead ? 'secondary' : 'primary'}
            icon={isRead ? Check : MailOpen}
            onClick={() => setIsRead((prev) => !prev)}
          >
            {isRead ? 'Marked read' : 'Mark read'}
          </Button>
          <Button
            variant="ghost"
            icon={Star}
            className={isStarred ? 'text-[color:var(--amber)]' : ''}
            onClick={() => setIsStarred((prev) => !prev)}
          >
            {isStarred ? 'Starred' : 'Star'}
          </Button>
          <Button
            variant="ghost"
            icon={Archive}
            className={isArchived ? 'text-[color:var(--teal)]' : ''}
            onClick={() => setIsArchived((prev) => !prev)}
          >
            {isArchived ? 'Archived' : 'Archive'}
          </Button>
          <Button variant="danger" icon={Trash2} onClick={() => setConfirmDelete(true)}>
            Delete
          </Button>
        </div>
      </div>

      <div className="rounded-[32px] border border-[color:var(--hairline)] bg-[color:var(--panel)]/80 p-6 shadow-[0_20px_80px_rgba(2,6,23,0.25)] sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-[color:var(--text-muted)]">{email.sender}</p>
            <h1 className="mt-2 font-display text-3xl font-semibold text-[color:var(--text)]">{email.subject}</h1>
          </div>
          <PriorityBadge level={email.priority} />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[color:var(--hairline)] bg-white/[0.04] p-5">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[color:var(--text-faint)]">Received</p>
            <p className="mt-3 text-sm font-semibold text-[color:var(--text)]">{email.received}</p>
          </div>
          <div className="rounded-2xl border border-[color:var(--hairline)] bg-white/[0.04] p-5">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[color:var(--text-faint)]">Source</p>
            <p className="mt-3 text-sm font-semibold text-[color:var(--text)]">PriorityPulse classifier</p>
          </div>
          <div className="rounded-2xl border border-[color:var(--hairline)] bg-white/[0.04] p-5">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[color:var(--text-faint)]">Tag</p>
            <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--text)]">
              <Tag className="h-4 w-4 text-[color:var(--text-faint)]" /> Email alert
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="min-w-0 rounded-[28px] border border-[color:var(--hairline)] bg-[color:var(--ink)]/60 p-6">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--text-faint)]">Email preview</p>
            <p className="mt-4 leading-8 text-[color:var(--text-muted)]">{email.body}</p>
          </div>
          <div className="space-y-4">
            <div className="rounded-[28px] border border-[color:var(--hairline)] bg-[color:var(--ink)]/60 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[color:var(--ember-soft)] p-2 text-[color:var(--ember)]">
                  <BrainCircuit className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-[color:var(--text)]">AI priority score</p>
                  <p className="text-sm text-[color:var(--text-muted)]">91 / 100</p>
                </div>
              </div>
              <div className="mt-4 h-2 rounded-full bg-[color:var(--hairline)]">
                <div className="h-2 w-[91%] rounded-full bg-gradient-to-r from-[color:var(--ember)] to-[color:var(--teal)]" />
              </div>
            </div>
            <div className="rounded-[28px] border border-[color:var(--hairline)] bg-[color:var(--ink)]/60 p-5">
              <div className="flex items-center gap-2 text-[color:var(--text)]">
                <TrendingUp className="h-4 w-4 text-[color:var(--teal)]" />
                <span className="font-medium">Explainability panel</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {['urgent', 'finance', 'escalation', 'customer impact'].map((tag) => (
                  <span key={tag} className="rounded-full border border-[color:var(--hairline)] px-3 py-1.5 text-xs text-[color:var(--text-muted)]">{tag}</span>
                ))}
              </div>
            </div>
            <div className="rounded-[28px] border border-[color:var(--hairline)] bg-[color:var(--ink)]/60 p-5">
              <div className="flex items-center gap-2 text-[color:var(--text)]">
                <Clock3 className="h-4 w-4 text-[color:var(--amber)]" />
                <span className="font-medium">Timeline</span>
              </div>
              <div className="mt-4 space-y-3 text-sm text-[color:var(--text-muted)]">
                <div className="flex items-center justify-between rounded-2xl border border-[color:var(--hairline)] px-3 py-2"><span>Detected</span><span className="font-mono text-[color:var(--text)]">08:12</span></div>
                <div className="flex items-center justify-between rounded-2xl border border-[color:var(--hairline)] px-3 py-2"><span>Escalated</span><span className="font-mono text-[color:var(--text)]">08:24</span></div>
                <div className="flex items-center justify-between rounded-2xl border border-[color:var(--hairline)] px-3 py-2"><span>Reviewed</span><span className="font-mono text-[color:var(--text)]">08:41</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={confirmDelete}
        title="Delete this email?"
        description="This removes the message from your inbox. This action can't be undone here."
        onClose={() => setConfirmDelete(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button variant="danger" icon={Trash2} onClick={handleDelete}>
              Delete email
            </Button>
          </>
        }
      >
        <p className="text-sm text-[color:var(--text-muted)]">
          "{email.subject}" from {email.sender} will be removed from your priority queue.
        </p>
      </Modal>
    </div>
  );
}

export default EmailDetails;
