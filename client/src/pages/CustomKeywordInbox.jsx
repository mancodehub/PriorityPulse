import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { RefreshCw, Search } from 'lucide-react';
import EmptyState from '../components/EmptyState/index.jsx';
import PriorityBadge from '../components/PriorityBadge/index.jsx';
import EmailDetail from '../components/EmailDetail.jsx';
import Toast from '../components/Toast.jsx';
import { getSocket } from '../socket.js';
import {
  fetchCustomKeywordEmails,
  fetchKeywords,
  refreshKeywordMatches,
} from '../api/client.js';

export default function CustomKeywordInbox() {
  const [emails, setEmails] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetchCustomKeywordEmails({ keyword, search });
      setEmails(response.data?.emails || []);
      setKeywords(response.data?.keywords || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load keyword matches.');
    } finally {
      setLoading(false);
    }
  }, [keyword, search]);

  useEffect(() => {
    fetchKeywords().then((response) => setKeywords(response.data?.keywords || [])).catch(() => {});
    load();
  }, [load]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;
    const handleKeywordMatch = (incoming) => {
      const keywordText = (incoming?.matchedKeywords || []).map((item) => item.keyword).join(', ');
      setToast(`New keyword match${keywordText ? `: ${keywordText}` : ''} — ${incoming?.subject || 'New email'}`);
      load();
    };
    socket.on('custom-keyword-match', handleKeywordMatch);
    return () => socket.off('custom-keyword-match', handleKeywordMatch);
  }, [load]);

  const refresh = async () => {
    try {
      setRefreshing(true);
      await refreshKeywordMatches();
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Gmail matches could not be refreshed.');
    } finally {
      setRefreshing(false);
    }
  };

  const selectedId = searchParams.get('email');
  const selectedEmail = emails.find((item) => (item._id || item.gmailMessageId) === selectedId);
  if (selectedId && selectedEmail) {
    return <EmailDetail email={{ ...selectedEmail, id: selectedEmail._id || selectedEmail.gmailMessageId }} onBack={() => setSearchParams({})} />;
  }

  return (
    <div className="space-y-6">
      <Toast message={toast} onClose={() => setToast('')} />
      <section className="rounded-[28px] border border-[color:var(--hairline)] bg-[color:var(--panel)]/80 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--ember)]">Custom inbox</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-[color:var(--text)]">Your keyword matches</h2>
            <p className="mt-3 text-sm leading-7 text-[color:var(--text-muted)]">Emails matching your enabled keywords, while keeping their original ML priority.</p>
          </div>
          <button type="button" onClick={refresh} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--teal)] px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-60">
            <RefreshCw className={refreshing ? 'animate-spin' : ''} size={16} /> {refreshing ? 'Refreshing…' : 'Search Gmail / Refresh matches'}
          </button>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <label className="flex flex-1 items-center gap-2 rounded-xl border border-[color:var(--hairline)] px-3 py-2.5 text-sm text-[color:var(--text-muted)]"><Search size={15} /><input className="w-full bg-transparent outline-none" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search matches" /></label>
          <select value={keyword} onChange={(event) => setKeyword(event.target.value)} className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--panel)] px-3 py-2.5 text-sm text-[color:var(--text)]">
            <option value="">All matches</option>
            {keywords.map((item) => <option key={item._id || item} value={item.keyword || item}>{item.keyword || item}</option>)}
          </select>
        </div>
      </section>

      {error ? <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">{error}</div> : null}
      {loading ? <p className="text-sm text-[color:var(--text-muted)]">Loading keyword matches…</p> : emails.length === 0 ? (
        <EmptyState title={keywords.length ? 'No matching emails' : 'Add a keyword to get started'} description={keywords.length ? 'Try another keyword or refresh Gmail matches.' : 'Create keywords in Settings, then search Gmail for matching messages.'} />
      ) : (
        <div className="grid gap-4">
          {emails.map((email) => (
            <Link key={email._id || email.gmailMessageId} to={`?email=${email._id || email.gmailMessageId}`} className="rounded-[20px] border border-[color:var(--hairline)] bg-[color:var(--panel)] p-5 transition hover:border-[color:var(--ember)]/50">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold text-[color:var(--text)]">{email.sender || 'Unknown sender'}</p><h3 className="mt-1 text-sm text-[color:var(--text)]">{email.subject || '(No subject)'}</h3><p className="mt-2 text-sm text-[color:var(--text-muted)]">{email.preview || email.body || 'No preview available.'}</p></div><PriorityBadge level={email.priority} /></div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-[color:var(--text-muted)]"><span>{email.date ? new Date(email.date).toLocaleString() : 'Recently'}</span>{email.unread ? <span className="text-[color:var(--ember)]">Unread</span> : <span>Read</span>}{(email.matchedKeywords || []).map((match) => <span key={`${match.keyword}-${match.priority}`} className="rounded-full border border-[color:var(--hairline)] px-2 py-1">{match.keyword}</span>)}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
