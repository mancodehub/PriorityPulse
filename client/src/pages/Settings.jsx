import { useEffect, useState } from 'react';
import {
  BellRing,
  SlidersHorizontal,
  Sparkles,
  Mail,
  CheckCircle2,
  ExternalLink,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import api, {
  createKeyword,
  deleteKeyword,
  fetchKeywords,
  updateKeyword,
} from '../api/client';
import DashboardLayout from '../components/DashboardLayout.jsx';

function Settings() {
  const [connected, setConnected] = useState(false);
  const [googleEmail, setGoogleEmail] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [keywords, setKeywords] = useState([]);
  const [keywordLoading, setKeywordLoading] = useState(true);
  const [keywordError, setKeywordError] = useState('');
  const [keywordForm, setKeywordForm] = useState(null);
  const [keywordSaving, setKeywordSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState('');

  useEffect(() => {
    let active = true;

    // Check query params if redirected from OAuth callback
    const params = new URLSearchParams(window.location.search);
    const gmailParam = params.get('gmail');
    if (gmailParam === 'connected') {
      setSuccessMessage('Gmail connected successfully!');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (gmailParam === 'error') {
      setError('Failed to connect Gmail. Please try again.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const checkStatus = async () => {
      try {
        setLoadingStatus(true);
        const response = await api.get('/gmail/status');
        if (!active) return;
        if (response.data?.success) {
          setConnected(Boolean(response.data.gmailConnected));
          setGoogleEmail(response.data.googleEmail || null);
        }
      } catch (err) {
        if (!active) return;
        console.error('Gmail status check error:', err);
      } finally {
        if (active) setLoadingStatus(false);
      }
    };

    checkStatus();

    fetchKeywords()
      .then((response) => {
        if (active) setKeywords(response.data?.keywords || []);
      })
      .catch((err) => {
        if (active) setKeywordError(err.response?.data?.message || 'Unable to load custom keywords.');
      })
      .finally(() => {
        if (active) setKeywordLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const openKeywordForm = (keyword = null, priority = 'HIGH') => {
    setKeywordForm({
      id: keyword?._id || '',
      keyword: keyword?.keyword || '',
      priority: keyword?.priority || priority,
      enabled: keyword?.enabled ?? true,
    });
    setKeywordError('');
  };

  const saveKeyword = async (event) => {
    event.preventDefault();
    if (!keywordForm?.keyword.trim()) {
      setKeywordError('Keyword cannot be empty.');
      return;
    }

    try {
      setKeywordSaving(true);
      const payload = {
        keyword: keywordForm.keyword.trim(),
        priority: keywordForm.priority,
        enabled: keywordForm.enabled,
      };
      const response = keywordForm.id
        ? await updateKeyword(keywordForm.id, payload)
        : await createKeyword(payload);
      const saved = response.data?.keyword;
      setKeywords((current) => keywordForm.id
        ? current.map((item) => item._id === keywordForm.id ? saved : item)
        : [...current, saved]);
      setKeywordForm(null);
      setSuccessMessage(keywordForm.id ? 'Custom keyword updated.' : 'Custom keyword added.');
    } catch (err) {
      setKeywordError(err.response?.data?.message || 'Unable to save custom keyword.');
    } finally {
      setKeywordSaving(false);
    }
  };

  const toggleKeyword = async (keyword) => {
    try {
      const response = await updateKeyword(keyword._id, { enabled: !keyword.enabled });
      setKeywords((current) => current.map((item) => item._id === keyword._id ? response.data.keyword : item));
    } catch (err) {
      setKeywordError(err.response?.data?.message || 'Unable to update custom keyword.');
    }
  };

  const removeKeyword = async (id) => {
    try {
      await deleteKeyword(id);
      setKeywords((current) => current.filter((item) => item._id !== id));
      setConfirmDeleteId('');
      setSuccessMessage('Custom keyword deleted.');
    } catch (err) {
      setKeywordError(err.response?.data?.message || 'Unable to delete custom keyword.');
    }
  };

  const keywordsByPriority = (priority) => keywords.filter((keyword) => keyword.priority === priority);

  const connectGmail = async () => {
    try {
      setConnecting(true);
      setError('');
      setSuccessMessage('');

      const response = await api.get('/gmail/connect');

      if (response.data?.authUrl) {
        window.location.href = response.data.authUrl;
      } else {
        setError('Unable to start Gmail connection.');
        setConnecting(false);
      }
    } catch (err) {
      console.error('Gmail connection error:', err);

      setError(
        err.response?.data?.message ||
          'Unable to connect Gmail. Please try again.'
      );

      setConnecting(false);
    }
  };

  const handleDisconnectGmail = async () => {
    try {
      setDisconnecting(true);
      setError('');
      setSuccessMessage('');

      const response = await api.post('/gmail/disconnect');

      if (response.data?.success) {
        setConnected(false);
        setGoogleEmail(null);
        setSuccessMessage('Gmail disconnected successfully.');
      } else {
        setError('Failed to disconnect Gmail.');
      }
    } catch (err) {
      console.error('Gmail disconnect error:', err);

      setError(
        err.response?.data?.message ||
          'Failed to disconnect Gmail. Please try again.'
      );
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <DashboardLayout title="Settings">
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-[28px] border border-[color:var(--hairline)] bg-[color:var(--panel)]/80 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.2)]">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--ember)]">
            Settings
          </p>

          <h2 className="mt-2 font-display text-3xl font-semibold text-[color:var(--text)]">
            Preferences and alert configuration
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--text-muted)]">
            Tune your dashboard experience to match the speed and focus of the
            team behind the inbox.
          </p>
        </div>

        {/* Gmail Integration */}
        <div className="rounded-[28px] border border-[color:var(--hairline)] bg-[color:var(--panel)]/80 p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--ember-soft)]">
                <Mail className="h-5 w-5 text-[color:var(--ember)]" />
              </div>

              <div>
                <h3 className="font-display text-lg font-semibold text-[color:var(--text)]">
                  Gmail Integration
                </h3>

                <p className="mt-1 text-sm text-[color:var(--text-muted)]">
                  Connect Gmail to analyze and prioritize your inbox.
                </p>
              </div>
            </div>

            <div className="hidden items-center gap-2 rounded-full border border-[color:var(--hairline)] px-3 py-1.5 text-xs font-medium text-[color:var(--text-muted)] sm:flex">
              <span
                className={`h-2 w-2 rounded-full ${
                  loadingStatus
                    ? 'bg-slate-400 animate-pulse'
                    : connected
                    ? 'bg-emerald-400'
                    : 'bg-slate-400'
                }`}
              />
              {loadingStatus
                ? 'Checking status...'
                : connected
                ? 'Connected'
                : 'Not connected'}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-[color:var(--hairline)] bg-white/[0.03] p-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    className={`h-4 w-4 ${
                      connected
                        ? 'text-emerald-400'
                        : 'text-[color:var(--teal)]'
                    }`}
                  />

                  <p className="font-medium text-[color:var(--text)]">
                    {connected
                      ? 'Gmail account connected'
                      : 'Secure Gmail connection'}
                  </p>
                </div>

                {connected && googleEmail && (
                  <p className="mt-1 font-mono text-xs text-[color:var(--ember)]">
                    Connected account: {googleEmail}
                  </p>
                )}

                <p className="mt-2 max-w-xl text-sm leading-6 text-[color:var(--text-muted)]">
                  {connected
                    ? 'PriorityPulse is connected to your Gmail account to read messages and prioritize your inbox.'
                    : 'PriorityPulse will use your Gmail connection to read inbox messages and classify their priority.'}
                </p>
              </div>

              {connected ? (
                <button
                  type="button"
                  onClick={handleDisconnectGmail}
                  disabled={disconnecting}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {disconnecting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-300/30 border-t-red-300" />
                      Disconnecting...
                    </>
                  ) : (
                    'Disconnect Gmail'
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={connectGmail}
                  disabled={connecting || loadingStatus}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[color:var(--ember)] px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {connecting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      Connect Gmail
                      <ExternalLink className="h-4 w-4" />
                    </>
                  )}
                </button>
              )}
            </div>

            {successMessage && (
              <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
                {successMessage}
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Custom keyword rules */}
        <div className="rounded-[28px] border border-[color:var(--hairline)] bg-[color:var(--panel)]/80 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[color:var(--text)]">
                <SlidersHorizontal className="h-4 w-4 text-[color:var(--teal)]" />
                <h3 className="font-display text-lg font-semibold">Custom keyword priority</h3>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--text-muted)]">
                Matching keywords in new email subjects or bodies appear in your separate custom inbox. ML remains the source of email priority.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openKeywordForm()}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[color:var(--ember)] px-4 py-2.5 text-sm font-semibold text-black transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Add keyword
            </button>
            <button
              type="button"
              onClick={() => { window.location.href = '/dashboard/custom-keywords'; }}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[color:var(--hairline)] px-4 py-2.5 text-sm text-[color:var(--text-muted)] transition hover:text-[color:var(--text)]"
            >
              Open custom inbox
            </button>
          </div>

          {keywordError && (
            <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
              {keywordError}
            </div>
          )}

          {keywordForm && (
            <form onSubmit={saveKeyword} className="mt-5 rounded-2xl border border-[color:var(--hairline)] bg-white/[0.03] p-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_160px_auto] sm:items-end">
                <label className="text-sm text-[color:var(--text-muted)]">
                  Keyword or phrase
                  <input
                    autoFocus
                    value={keywordForm.keyword}
                    onChange={(event) => setKeywordForm((current) => ({ ...current, keyword: event.target.value }))}
                    maxLength={120}
                    placeholder="e.g. payment overdue"
                    className="mt-2 w-full rounded-xl border border-[color:var(--hairline)] bg-black/20 px-3 py-2.5 text-sm text-[color:var(--text)] outline-none focus:border-[color:var(--ember)]"
                  />
                </label>
                <label className="text-sm text-[color:var(--text-muted)]">
                  Priority
                  <select
                    value={keywordForm.priority}
                    onChange={(event) => setKeywordForm((current) => ({ ...current, priority: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-[color:var(--hairline)] bg-[color:var(--panel)] px-3 py-2.5 text-sm text-[color:var(--text)] outline-none focus:border-[color:var(--ember)]"
                  >
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setKeywordForm(null)} className="rounded-xl border border-[color:var(--hairline)] px-3 py-2.5 text-sm text-[color:var(--text-muted)] hover:text-[color:var(--text)]">Cancel</button>
                  <button type="submit" disabled={keywordSaving} className="rounded-xl bg-[color:var(--teal)] px-3 py-2.5 text-sm font-semibold text-black disabled:opacity-60">{keywordSaving ? 'Saving…' : 'Save'}</button>
                </div>
              </div>
            </form>
          )}

          {keywordLoading ? (
            <p className="mt-5 text-sm text-[color:var(--text-muted)]">Loading keywords…</p>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {['HIGH', 'MEDIUM', 'LOW'].map((priority) => (
                <div key={priority} className="rounded-2xl border border-[color:var(--hairline)] bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold tracking-[0.18em] text-[color:var(--text-muted)]">{priority}</p>
                    <button type="button" onClick={() => openKeywordForm(null, priority)} className="text-xs text-[color:var(--ember)] hover:underline">Add</button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {keywordsByPriority(priority).length === 0 ? (
                      <p className="text-sm text-[color:var(--text-muted)]">No rules yet.</p>
                    ) : keywordsByPriority(priority).map((item) => (
                      <div key={item._id} className="flex items-center gap-2 rounded-xl border border-[color:var(--hairline)] px-3 py-2">
                        <span className={`min-w-0 flex-1 truncate text-sm ${item.enabled ? 'text-[color:var(--text)]' : 'text-[color:var(--text-muted)] line-through'}`}>{item.keyword}</span>
                        <button type="button" title="Edit keyword" onClick={() => openKeywordForm(item)} className="text-[color:var(--text-muted)] hover:text-[color:var(--text)]"><Pencil className="h-3.5 w-3.5" /></button>
                        <button type="button" onClick={() => toggleKeyword(item)} className="text-xs text-[color:var(--teal)]">{item.enabled ? 'On' : 'Off'}</button>
                        {confirmDeleteId === item._id ? (
                          <button type="button" onClick={() => removeKeyword(item._id)} className="text-xs text-red-300">Confirm</button>
                        ) : (
                          <button type="button" title="Delete keyword" onClick={() => setConfirmDeleteId(item._id)} className="text-[color:var(--text-muted)] hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /></button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      {/* Notification + Dashboard */}
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[28px] border border-[color:var(--hairline)] bg-[color:var(--panel)]/80 p-6">
          <div className="flex items-center gap-2 text-[color:var(--text)]">
            <BellRing className="h-4 w-4 text-[color:var(--ember)]" />
            <h3 className="font-display text-lg font-semibold">
              Notification settings
            </h3>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-[color:var(--hairline)] bg-white/[0.03] p-5">
              <p className="font-medium text-[color:var(--text)]">
                Email alerts
              </p>

              <p className="mt-2 text-sm text-[color:var(--text-muted)]">
                Receive summary alerts for high-priority classification events.
              </p>
            </div>

            <div className="rounded-2xl border border-[color:var(--hairline)] bg-white/[0.03] p-5">
              <p className="font-medium text-[color:var(--text)]">
                Realtime updates
              </p>

              <p className="mt-2 text-sm text-[color:var(--text-muted)]">
                Enable live channel updates for critical email workflows.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-[color:var(--hairline)] bg-[color:var(--panel)]/80 p-6">
          <div className="flex items-center gap-2 text-[color:var(--text)]">
            <SlidersHorizontal className="h-4 w-4 text-[color:var(--teal)]" />
            <h3 className="font-display text-lg font-semibold">
              Dashboard preferences
            </h3>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-[color:var(--hairline)] bg-white/[0.03] p-5">
              <p className="font-medium text-[color:var(--text)]">
                Layout mode
              </p>

              <p className="mt-2 text-sm text-[color:var(--text-muted)]">
                Default responsive dashboard with collapsible menu.
              </p>
            </div>

            <div className="rounded-2xl border border-[color:var(--hairline)] bg-white/[0.03] p-5">
              <p className="font-medium text-[color:var(--text)]">
                Theme
              </p>

              <p className="mt-2 text-sm text-[color:var(--text-muted)]">
                Dark signal-console look, tuned for real-time monitoring.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Workspace */}
      <div className="rounded-[28px] border border-[color:var(--hairline)] bg-gradient-to-br from-[color:var(--ember-soft)] to-[color:var(--teal-soft)] p-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[color:var(--ember)]" />

          <p className="font-medium text-[color:var(--text)]">
            Workspace control center
          </p>
        </div>

        <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--text-muted)]">
          The experience stays responsive and accessible across laptop,
          tablet, and mobile screens.
        </p>
      </div>
    </div>
  </DashboardLayout>
);
}

export default Settings;
