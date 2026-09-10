import { Check, Loader2, Sparkles } from 'lucide-react';
import PriorityBadge from './PriorityBadge.jsx';

export default function AIInsight({ email, loading = false }) {
  if (loading) {
    return (
      <aside
        className="pp-ai-insight pp-ai-insight--loading"
        aria-busy="true"
      >
        <div className="pp-ai-head">
          <span className="pp-ai-icon">
            <Sparkles size={16} />
          </span>

          <div>
            <strong>PriorityPulse AI</strong>
            <small>Analyzing email...</small>
          </div>

          <Loader2 className="pp-ai-loader" size={16} />
        </div>

        <div className="pp-ai-loading-line" />
      </aside>
    );
  }

  // Safety defaults for real Gmail emails
  const safeEmail = email || {};
  const priority = safeEmail.priority || 'MEDIUM';
  const confidence = safeEmail.confidence ?? 0;

  const reasons = Array.isArray(safeEmail.reasons)
    ? safeEmail.reasons
    : [
        'AI classification details will appear here.',
        'PriorityPulse is analyzing this email.',
      ];

  return (
    <aside className="pp-ai-insight">
      <div className="pp-ai-head">
        <span className="pp-ai-icon">
          <Sparkles size={16} />
        </span>

        <div>
          <strong>PriorityPulse AI</strong>
          <small>Classification explained</small>
        </div>

        <b>
          {confidence}
          <small>% confidence</small>
        </b>
      </div>

      <div className="pp-ai-priority">
        <PriorityBadge priority={priority} />
        <span>Why this signal?</span>
      </div>

      <ul>
        {reasons.map((reason, index) => (
          <li key={`${reason}-${index}`}>
            <Check size={14} />
            {reason}
          </li>
        ))}
      </ul>
    </aside>
  );
}