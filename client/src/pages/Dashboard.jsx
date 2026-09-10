import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Check,
  ChevronDown,
  CircleAlert,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

import DashboardLayout from '../components/DashboardLayout.jsx';
import StatCard from '../components/StatCard.jsx';
import EmailCard from '../components/EmailCard.jsx';
import EmailDetail from '../components/EmailDetail.jsx';
import PriorityBadge from '../components/PriorityBadge.jsx';
import LoadingSkeleton from '../components/LoadingSkeleton.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import Toast from '../components/Toast.jsx';

import { fetchEmails } from '../api/client.js';

function Page({ title, children }) {
  return (
    <DashboardLayout title={title}>
      {children}
    </DashboardLayout>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

export default function Dashboard() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [gmailNotConnected, setGmailNotConnected] = useState(false);

  const loadDashboardEmails = async () => {
    try {
      setLoading(true);
      setLoadError(false);

      const { data } = await fetchEmails();

      setEmails(data.emails || []);
    } catch (error) {
      console.error('Failed to load dashboard emails:', error);
      const isNotConn =
        error.response?.status === 400 &&
        (error.response?.data?.message?.toLowerCase().includes('gmail') ||
          error.response?.data?.message?.toLowerCase().includes('not connected'));
      setGmailNotConnected(Boolean(isNotConn));
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardEmails();
  }, []);

  const totalEmails = emails.length;

  const highPriorityEmails = emails.filter(
    (email) => email.priority === 'HIGH'
  ).length;

  const unreadEmails = emails.filter(
    (email) => email.unread
  ).length;

  const aiProcessedEmails = emails.filter(
    (email) =>
      email.priority === 'HIGH' ||
      email.priority === 'MEDIUM' ||
      email.priority === 'LOW'
  ).length;

  return (
    <Page title="Dashboard">

      {/* Welcome */}
      <div className="pp-welcome">
        <div>
          <p className="overline">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </p>

          <h2>
            Good morning, Naomi <em>👋</em>
          </h2>

          <p>
            Here’s the signal from your inbox today.
          </p>
        </div>

        <button
          className="button button--primary"
          onClick={() => {
            window.location.href = '/dashboard/inbox';
          }}
        >
          Open priority inbox <span>→</span>
        </button>
      </div>

      {/* Stats */}
      <div className="pp-stat-grid">

        <StatCard
          label="Total emails"
          value={loading ? '—' : totalEmails}
          note="Emails currently loaded"
        />

        <StatCard
          label="High priority"
          value={loading ? '—' : highPriorityEmails}
          note="Need attention"
          accent="pp-stat-card--coral"
        />

        <StatCard
          label="Unread"
          value={loading ? '—' : unreadEmails}
          note="Unread messages"
        />

        <StatCard
          label="AI processed"
          value={loading ? '—' : aiProcessedEmails}
          note="Currently classified"
          accent="pp-stat-card--lime"
        />

      </div>

      {/* Dashboard content */}
      <div className="pp-dashboard-grid">

        {/* Priority inbox */}
        <section className="pp-panel pp-priority-panel">

          <div className="pp-panel-heading">

            <div>
              <p className="overline">
                Your next move
              </p>

              <h3>
                Priority inbox
              </h3>
            </div>

            <a href="/dashboard/inbox">
              View all <span>↗</span>
            </a>

          </div>

          {loading ? (
            <LoadingSkeleton />
          ) : loadError ? (
            <ErrorState
              title={
                gmailNotConnected
                  ? 'Gmail not connected'
                  : 'Unable to load emails'
              }
              message={
                gmailNotConnected
                  ? 'Connect Gmail to view your inbox.'
                  : "We couldn't load your Gmail messages right now."
              }
              onRetry={
                gmailNotConnected
                  ? () => {
                      window.location.href = '/dashboard/settings';
                    }
                  : loadDashboardEmails
              }
              retryLabel={
                gmailNotConnected
                  ? 'Go to Settings'
                  : 'Try again'
              }
            />
          ) : emails.length === 0 ? (
            <EmptyState
              title="No emails yet"
              message="Your Gmail inbox is empty."
            />
          ) : (
            emails
              .slice(0, 4)
              .map((email) => (
                <EmailCard
                  key={email.id}
                  email={email}
                  onSelect={() => {
                    window.location.href =
                      `/dashboard/inbox?email=${email.id}`;
                  }}
                />
              ))
          )}

        </section>

        {/* AI signal */}
        <section className="pp-panel pp-signal-panel">

          <div className="pp-panel-heading">

            <div>
              <p className="overline">
                AI signal
              </p>

              <h3>
                Inbox at a glance
              </h3>
            </div>

            <Sparkles size={17} />

          </div>

          <div className="pp-signal-score">

            <strong>
              {totalEmails > 0 ? '92' : '0'}
              <span>%</span>
            </strong>

            <p>
              of your inbox is
              <br />
              calmly classified
            </p>

          </div>

          <div className="pp-bars">

            <div>
              <span>
                High priority
              </span>

              <i>
                <b
                  style={{
                    width:
                      totalEmails > 0
                        ? `${Math.min(
                            (highPriorityEmails / totalEmails) * 100,
                            100
                          )}%`
                        : '0%',
                  }}
                />
              </i>

              <em>
                {highPriorityEmails}
              </em>
            </div>

            <div>
              <span>
                Medium priority
              </span>

              <i>
                <b
                  className="medium"
                  style={{
                    width:
                      totalEmails > 0
                        ? `${Math.min(
                            (emails.filter(
                              (email) =>
                                email.priority === 'MEDIUM'
                            ).length /
                              totalEmails) *
                              100,
                            100
                          )}%`
                        : '0%',
                  }}
                />
              </i>

              <em>
                {
                  emails.filter(
                    (email) => email.priority === 'MEDIUM'
                  ).length
                }
              </em>
            </div>

            <div>
              <span>
                Low priority
              </span>

              <i>
                <b
                  className="low"
                  style={{
                    width:
                      totalEmails > 0
                        ? `${Math.min(
                            (emails.filter(
                              (email) =>
                                email.priority === 'LOW'
                            ).length /
                              totalEmails) *
                              100,
                            100
                          )}%`
                        : '0%',
                  }}
                />
              </i>

              <em>
                {
                  emails.filter(
                    (email) => email.priority === 'LOW'
                  ).length
                }
              </em>
            </div>

          </div>

          <div className="pp-signal-note">

            <TrendingUp size={16} />

            <span>
              AI classification will become smarter
              once the ML model is connected.
            </span>

          </div>

        </section>

      </div>

    </Page>
  );
}

/* =========================================================
   INBOX
========================================================= */

export function Inbox({
  importantOnly = false,
  initialFilter = 'ALL',
}) {
  const [emails, setEmails] = useState([]);
  const [selected, setSelected] = useState(null);

  const [filter, setFilter] = useState(
    importantOnly ? 'HIGH' : initialFilter
  );

  const [status, setStatus] = useState('ALL');

  const [query, setQuery] = useState('');

  const [loading, setLoading] = useState(true);

  const [aiLoading, setAiLoading] = useState(false);

  const [loadError, setLoadError] = useState(false);
  const [gmailNotConnected, setGmailNotConnected] = useState(false);

  const [toast, setToast] = useState('');

  /* ---------------------------------------------------------
     LOAD REAL GMAIL EMAILS
  --------------------------------------------------------- */

  const loadEmails = async () => {
    try {
      setLoadError(false);
      setLoading(true);

      const { data } = await fetchEmails();

      setEmails(data.emails || []);

      /*
       * If the currently selected email no longer exists,
       * clear it.
       */
      if (selected) {
        const stillExists = (data.emails || []).some(
          (email) => email.id === selected.id
        );

        if (!stillExists) {
          setSelected(null);
        }
      }

    } catch (error) {
      console.error('Failed to load emails:', error);
      const isNotConn =
        error.response?.status === 400 &&
        (error.response?.data?.message?.toLowerCase().includes('gmail') ||
          error.response?.data?.message?.toLowerCase().includes('not connected'));
      setGmailNotConnected(Boolean(isNotConn));

      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmails();
  }, []);

  /* ---------------------------------------------------------
     FILTER EMAILS
  --------------------------------------------------------- */

  const list = useMemo(() => {
    return emails.filter((email) => {

      const haystack = `
        ${email.sender || ''}
        ${email.subject || ''}
        ${email.preview || ''}
        ${email.body || ''}
      `.toLowerCase();

      const matchesPriority =
        filter === 'ALL' ||
        email.priority === filter;

      const matchesStatus =
        status === 'ALL' ||
        (
          status === 'UNREAD'
            ? email.unread
            : !email.unread
        );

      const matchesImportant =
        !importantOnly ||
        email.important;

      const matchesSearch =
        haystack.includes(
          query.toLowerCase()
        );

      return (
        matchesPriority &&
        matchesStatus &&
        matchesImportant &&
        matchesSearch
      );
    });
  }, [
    emails,
    filter,
    status,
    query,
    importantOnly,
  ]);

  /* ---------------------------------------------------------
     SELECT EMAIL
  --------------------------------------------------------- */

  const selectEmail = (email) => {
    setSelected(email);

    setAiLoading(true);

    setToast(
      `Email classified as ${email.priority || 'PENDING'}`
    );

    setTimeout(() => {
      setAiLoading(false);
    }, 650);
  };

  /* ---------------------------------------------------------
     CLEAR FILTERS
  --------------------------------------------------------- */

  const clearFilters = () => {
    setFilter(
      importantOnly
        ? 'HIGH'
        : 'ALL'
    );

    setStatus('ALL');

    setQuery('');
  };

  /* ---------------------------------------------------------
     PREVIEW EMAIL
  --------------------------------------------------------- */

  const previewEmail =
    selected ||
    list[0];

  return (
    <Page
      title={
        importantOnly
          ? 'High priority'
          : 'Priority inbox'
      }
    >

      {/* Page intro */}
      <div className="pp-page-intro">

        <div>

          <p className="overline">
            {importantOnly
              ? 'Only what matters most'
              : 'All your email, understood'}
          </p>

          <h2>

            {importantOnly
              ? 'High priority'
              : 'Priority inbox'}

            <span className="pp-count">
              {list.length}
            </span>

          </h2>

          <p>
            Every message arrives with a reason
            to act — or not.
          </p>

        </div>

        {/* Tools */}
        <div className="pp-inbox-tools">

          <label className="pp-inline-search">

            <SlidersHorizontal size={15} />

            <input
              aria-label="Search emails"
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Search emails..."
            />

          </label>

          <button
            className="pp-filter-button"
            onClick={loadEmails}
            disabled={loading}
          >

            <RefreshCw
              size={14}
              className={
                loading
                  ? 'pp-spin'
                  : ''
              }
            />

            {loading
              ? 'Syncing...'
              : 'Sync inbox'}

          </button>

        </div>

      </div>

      {/* Filters */}
      <div className="pp-filter-toolbar">

        <div
          className="pp-filter-tabs"
          aria-label="Priority filters"
        >

          {[
            'ALL',
            'HIGH',
            'MEDIUM',
            'LOW',
          ].map((item) => (

            <button
              className={
                filter === item
                  ? 'active'
                  : ''
              }
              key={item}
              onClick={() =>
                setFilter(item)
              }
            >

              {item === 'ALL'
                ? 'All'
                : (
                  <PriorityBadge
                    priority={item}
                  />
                )}

            </button>

          ))}

        </div>

        {/* Read / unread */}
        <div
          className="pp-status-tabs"
          aria-label="Read status filters"
        >

          {[
            'ALL',
            'UNREAD',
            'READ',
          ].map((item) => (

            <button
              className={
                status === item
                  ? 'active'
                  : ''
              }
              key={item}
              onClick={() =>
                setStatus(item)
              }
            >

              {item === 'ALL'
                ? 'All status'
                : item[0] +
                  item
                    .slice(1)
                    .toLowerCase()}

            </button>

          ))}

        </div>

        {/* Clear */}
        {(
          query ||
          filter !== (
            importantOnly
              ? 'HIGH'
              : 'ALL'
          ) ||
          status !== 'ALL'
        ) && (

          <button
            className="pp-clear-filters"
            onClick={clearFilters}
          >
            Clear filters
          </button>

        )}

      </div>

      {/* Workspace */}
      {loading ? (

        <div className="pp-workspace">
          <LoadingSkeleton />
        </div>

      ) : loadError ? (

        <div className="pp-workspace">

          <ErrorState
            title={
              gmailNotConnected
                ? 'Gmail not connected'
                : 'Unable to load emails'
            }
            message={
              gmailNotConnected
                ? 'Connect Gmail to view your inbox.'
                : "We couldn't load your Gmail messages right now."
            }
            onRetry={
              gmailNotConnected
                ? () => {
                    window.location.href = '/dashboard/settings';
                  }
                : loadEmails
            }
            retryLabel={
              gmailNotConnected
                ? 'Connect Gmail'
                : 'Try again'
            }
          />

        </div>

      ) : (

        <div className="pp-workspace">

          {/* Email list */}
          <section className="pp-email-list">

            {list.map((email) => (

              <EmailCard
                key={email.id}
                email={email}
                selected={
                  selected?.id === email.id ||
                  (
                    !selected &&
                    email.id ===
                      list[0]?.id
                  )
                }
                onSelect={selectEmail}
              />

            ))}

            {/* Empty state */}
            {!list.length && (

              <EmptyState
                title={
                  query ||
                  status !== 'ALL'
                    ? 'No emails found'
                    : importantOnly
                      ? 'No high-priority emails'
                      : 'No emails yet'
                }

                message={
                  query ||
                  status !== 'ALL'
                    ? 'Try changing your search or filters.'
                    : importantOnly
                      ? "You're all caught up."
                      : 'Your inbox is empty. New emails will appear here automatically.'
                }

                action={
                  query ||
                  status !== 'ALL'
                    ? {
                        label:
                          'Clear filters',
                        onClick:
                          clearFilters,
                      }
                    : undefined
                }
              />

            )}

          </section>

          {/* Email detail */}
          {previewEmail && (

            <section
              className={
                `pp-workspace-detail${
                  selected
                    ? ' is-open'
                    : ''
                }`
              }
            >

              <EmailDetail
                email={previewEmail}
                aiLoading={aiLoading}
                onBack={() =>
                  setSelected(null)
                }
              />

            </section>

          )}

        </div>

      )}

      {/* Toast */}
      <Toast
        message={toast}
        onClose={() =>
          setToast('')
        }
      />

    </Page>
  );
}

/* =========================================================
   ANALYTICS
========================================================= */

export function Analytics() {
  return (
    <Page title="Analytics">

      <div className="pp-page-intro">

        <div>

          <p className="overline">
            The bigger picture
          </p>

          <h2>
            Your inbox, in context.
          </h2>

          <p>
            See how PriorityPulse is helping
            your attention move with intention.
          </p>

        </div>

        <button className="pp-filter-button">

          <ChevronDown size={15} />

          Last 7 days

        </button>

      </div>

      <div className="pp-analytics-grid">

        {/* Volume chart */}
        <section className="pp-panel pp-chart-panel">

          <div className="pp-panel-heading">

            <div>

              <p className="overline">
                Volume
              </p>

              <h3>
                Weekly email flow
              </h3>

            </div>

            <span className="pp-chart-legend">
              <i />
              All email
            </span>

          </div>

          <div className="pp-chart">

            <div className="pp-y-labels">

              <span>240</span>
              <span>180</span>
              <span>120</span>
              <span>60</span>
              <span>0</span>

            </div>

            <div className="pp-chart-area">

              <div className="pp-grid-lines">

                <i />
                <i />
                <i />
                <i />
                <i />

              </div>

              <svg
                viewBox="0 0 600 190"
                preserveAspectRatio="none"
              >

                <path
                  d="M0 142 C50 120,70 132,110 108 S170 116,205 90 S270 105,300 74 S360 93,400 51 S465 65,500 35 S560 52,600 18"
                  fill="none"
                  stroke="#ddff5b"
                  strokeWidth="4"
                />

                <path
                  d="M0 142 C50 120,70 132,110 108 S170 116,205 90 S270 105,300 74 S360 93,400 51 S465 65,500 35 S560 52,600 18 V190 H0Z"
                  fill="rgba(221,255,91,.14)"
                />

              </svg>

              <div className="pp-x-labels">

                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>

              </div>

            </div>

          </div>

        </section>

        {/* Distribution */}
        <section className="pp-panel pp-distribution">

          <div className="pp-panel-heading">

            <div>

              <p className="overline">
                Classification
              </p>

              <h3>
                Priority distribution
              </h3>

            </div>

            <Sparkles size={16} />

          </div>

          <div className="pp-donut">

            <div>

              <strong>162</strong>

              <span>
                messages
              </span>

            </div>

          </div>

          <div className="pp-legend">

            <span>
              <i className="high" />
              High
              <b>24</b>
            </span>

            <span>
              <i className="medium" />
              Medium
              <b>51</b>
            </span>

            <span>
              <i className="low" />
              Low
              <b>87</b>
            </span>

          </div>

        </section>

      </div>

      <div className="pp-stat-grid pp-analytics-stats">

        <StatCard
          label="Avg. confidence"
          value="91.8%"
          note="+2.1% this week"
        />

        <StatCard
          label="Processed"
          value="1,197"
          note="93.2% of inbox"
          accent="pp-stat-card--lime"
        />

        <StatCard
          label="Saved triage time"
          value="2h 18m"
          note="Across your team"
        />

      </div>

    </Page>
  );
}

/* =========================================================
   NOTIFICATIONS
========================================================= */

export function Notifications() {
  const [toast, setToast] = useState('');

  const [items, setItems] = useState([
    {
      icon: CircleAlert,
      title: 'High-priority email detected',
      copy: 'Apex Financial needs your response',
      time: '8 minutes ago',
      tone: 'coral',
    },
    {
      icon: Sparkles,
      title: 'Email classified',
      copy: 'Q3 contract renewal → HIGH',
      time: '8 minutes ago',
      tone: 'lime',
    },
    {
      icon: Bell,
      title: 'Daily inbox summary',
      copy: '24 emails processed',
      time: 'Yesterday at 6:00 PM',
      tone: 'blue',
    },
  ]);

  const clear = () => {
    setItems([]);
    setToast('Changes saved');
  };

  return (
    <Page title="Notifications">

      <div className="pp-page-intro">

        <div>

          <p className="overline">
            Stay in the loop
          </p>

          <h2>
            Signals worth seeing.
          </h2>

          <p>
            Quiet by default. Clear when it matters.
          </p>

        </div>

        {items.length > 0 && (

          <button
            className="pp-filter-button"
            onClick={clear}
          >

            <Check size={15} />

            Mark all read

          </button>

        )}

      </div>

      <section className="pp-notification-list">

        {items.length ? (

          items.map(
            ({
              icon: Icon,
              title,
              copy,
              time,
              tone,
            }) => (

              <article
                key={title}
                className="pp-notification"
              >

                <span
                  className={
                    `pp-notification-icon ${tone}`
                  }
                >

                  <Icon size={18} />

                </span>

                <div>

                  <strong>
                    {title}
                  </strong>

                  <p>
                    {copy}
                  </p>

                  <small>
                    {time}
                  </small>

                </div>

                <i />

              </article>

            )
          )

        ) : (

          <EmptyState
            title="No new notifications"
            message="You're all caught up."
          />

        )}

      </section>

      <Toast
        message={toast}
        onClose={() =>
          setToast('')
        }
      />

    </Page>
  );
}