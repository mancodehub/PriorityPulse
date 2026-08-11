import { CircleAlert, RefreshCw } from 'lucide-react';

export default function ErrorState({ title = 'Something went wrong', message = 'Please try again.', onRetry }) {
  return <div className="pp-state pp-error-state" role="alert"><span className="pp-state-icon"><CircleAlert size={21} /></span><h3>{title}</h3><p>{message}</p>{onRetry && <button className="pp-state-action" onClick={onRetry}><RefreshCw size={14} /> Try again</button>}</div>;
}
