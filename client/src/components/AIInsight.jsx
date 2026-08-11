import { Check, Loader2, Sparkles } from 'lucide-react';
import PriorityBadge from './PriorityBadge.jsx';

export default function AIInsight({ email, loading = false }) {
  if (loading) return <aside className="pp-ai-insight pp-ai-insight--loading" aria-busy="true"><div className="pp-ai-head"><span className="pp-ai-icon"><Sparkles size={16} /></span><div><strong>PriorityPulse AI</strong><small>Analyzing email...</small></div><Loader2 className="pp-ai-loader" size={16} /></div><div className="pp-ai-loading-line" /></aside>;
  return <aside className="pp-ai-insight">
    <div className="pp-ai-head"><span className="pp-ai-icon"><Sparkles size={16} /></span><div><strong>PriorityPulse AI</strong><small>Classification explained</small></div><b>{email.confidence}<small>% confidence</small></b></div>
    <div className="pp-ai-priority"><PriorityBadge priority={email.priority} /><span>Why this signal?</span></div>
    <ul>{email.reasons.map((reason) => <li key={reason}><Check size={14} />{reason}</li>)}</ul>
  </aside>;
}
