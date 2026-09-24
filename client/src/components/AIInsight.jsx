import { Check, Loader2, Sparkles } from 'lucide-react';
import PriorityBadge from './PriorityBadge.jsx';

export default function AIInsight({
  email,
  insights,
  insightsError = false,
  loading = false,
}) {
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

  if (insights) {
    const averageConfidence = typeof insights.averageConfidence === 'number'
      ? Math.round((insights.averageConfidence <= 1
        ? insights.averageConfidence * 100
        : insights.averageConfidence))
      : 0;
    const reasons = Array.isArray(insights.topHighPriorityReasons)
      ? insights.topHighPriorityReasons
      : [];
    const recentHighPriorityEmails = Array.isArray(insights.recentHighPriorityEmails)
      ? insights.recentHighPriorityEmails
      : [];

    return (
      <aside className="pp-ai-insight">
        <div className="pp-ai-head">
          <span className="pp-ai-icon"><Sparkles size={16} /></span>
          <div>
            <strong>PriorityPulse AI</strong>
            <small>Stored classification insights</small>
          </div>
          <b>
            {averageConfidence}%
            <small>average confidence</small>
          </b>
        </div>

        <div className="pp-ai-priority">
          <span>Classified emails</span>
          <strong>{insights.classifiedEmails || 0}</strong>
        </div>

        <div className="pp-ai-priority">
          <span>Confidence bands</span>
          <strong>
            {insights.highConfidence || 0} / {insights.mediumConfidence || 0} / {insights.lowConfidence || 0}
          </strong>
        </div>

        <ul>
          {reasons.length > 0 ? reasons.map((item) => (
            <li key={item.reason}>
              <Check size={14} />
              {item.reason} ({item.count})
            </li>
          )) : (
            <li><Check size={14} />No stored HIGH-priority reasons yet.</li>
          )}
        </ul>

        {recentHighPriorityEmails.length > 0 && (
          <div className="pp-ai-recent">
            <small>Recent HIGH-priority emails</small>
            {recentHighPriorityEmails.map((item) => (
              <div key={item.id || item.gmailMessageId}>
                <strong>{item.subject || '(No subject)'}</strong>
                <span>{item.sender || 'Unknown sender'}</span>
              </div>
            ))}
          </div>
        )}
      </aside>
    );
  }

  if (insightsError) {
    return (
      <aside className="pp-ai-insight">
        <div className="pp-ai-head">
          <span className="pp-ai-icon"><Sparkles size={16} /></span>
          <div>
            <strong>PriorityPulse AI</strong>
            <small>AI insights unavailable</small>
          </div>
        </div>
        <p>Stored email classifications are temporarily unavailable.</p>
      </aside>
    );
  }

  // Safety defaults for real Gmail emails
  const safeEmail = email || {};
  const priority = safeEmail.priority || 'MEDIUM';
  const confidence = typeof safeEmail.confidence === 'number'
    ? `${Math.round(safeEmail.confidence * 100)}%`
    : 'Confidence unavailable';

  const reasons = Array.isArray(safeEmail.aiReasons)
    ? safeEmail.aiReasons
    : Array.isArray(safeEmail.reasons)
      ? safeEmail.reasons
    : [
          'AI classification details are unavailable.',
        ];
  const matchedKeywords = Array.isArray(safeEmail.matchedKeywords)
    ? safeEmail.matchedKeywords
    : [];

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
          <small>confidence</small>
        </b>
      </div>

      <div className="pp-ai-priority">
        <PriorityBadge priority={priority} />
        <span>Why this signal?</span>
      </div>

      {matchedKeywords.length > 0 && (
        <div className="pp-ai-custom-keywords">
          <small>Custom keyword matches</small>
          <ul>
            {matchedKeywords.map((match, index) => (
              <li key={`${match.keyword}-${match.priority}-${index}`}>
                <Check size={14} />
                <span>{match.keyword}</span>
                <b>{match.priority}</b>
              </li>
            ))}
          </ul>
        </div>
      )}

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
