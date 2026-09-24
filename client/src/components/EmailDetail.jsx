import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Clock3, LoaderCircle, Paperclip, RefreshCw, Reply, Star } from 'lucide-react';
import PriorityBadge from './PriorityBadge.jsx';
import AIInsight from './AIInsight.jsx';
import {
  downloadEmailAttachment,
  fetchEmailById,
  fetchEmailThread,
} from '../api/client.js';
import { sanitizeEmailHtml } from '../utils/sanitizeEmailHtml.js';

const formatConfidence = (confidence) => {
  if (typeof confidence !== 'number') return 'Confidence unavailable';
  return `${Math.round((confidence <= 1 ? confidence : confidence / 100) * 100)}% confidence`;
};

function AttachmentList({ email, onDownload, downloadingAttachment }) {
  const attachments = Array.isArray(email?.attachments) ? email.attachments : [];
  if (attachments.length === 0) return null;

  return (
    <div className="pp-attachments">
      <strong><Paperclip size={14} /> Attachments</strong>
      {attachments.map((attachment) => (
        <div key={`${attachment.attachmentId || attachment.filename}-${attachment.size}`} className="pp-attachment">
          <span>{attachment.filename || 'Attachment'}</span>
          <small>
            {attachment.mimeType || 'File'}
            {attachment.size ? ` · ${Math.ceil(attachment.size / 1024)} KB` : ''}
          </small>
          <button
            type="button"
            className="pp-attachment-download"
            onClick={() => onDownload(email, attachment)}
            disabled={!attachment.attachmentId || downloadingAttachment === attachment.attachmentId}
          >
            {downloadingAttachment === attachment.attachmentId ? 'Downloading…' : 'Download'}
          </button>
        </div>
      ))}
    </div>
  );
}

function ThreadMessages({ messages, expandedMessageId, onExpand, onDownload, downloadingAttachment }) {
  return (
    <div className="pp-thread">
      {messages.map((message) => {
        const messageId = message.gmailMessageId || message.id;
        const expanded = expandedMessageId === messageId;
        const safeHtml = sanitizeEmailHtml(message.bodyHtml || '');

        return (
          <section className="pp-thread-message" key={messageId}>
            <button
              type="button"
              className="pp-thread-message-header"
              onClick={() => onExpand(messageId)}
            >
              <span>
                <strong>{message.sender || 'Unknown Sender'}</strong>
                <small>{message.date || 'Recently'}</small>
              </span>
              <span>
                <PriorityBadge priority={message.priority || 'MEDIUM'} />
                <small>{formatConfidence(message.confidence)}</small>
              </span>
            </button>
            {expanded && (
              <div className="pp-thread-message-body">
                {message.subject && <h3>{message.subject}</h3>}
                {safeHtml ? (
                  <div className="pp-message-content pp-message-html" dangerouslySetInnerHTML={{ __html: safeHtml }} />
                ) : (
                  <p className="pp-message-content">
                    {message.bodyText || message.body || message.preview || 'No message content.'}
                  </p>
                )}
                <AttachmentList
                  email={message}
                  onDownload={onDownload}
                  downloadingAttachment={downloadingAttachment}
                />
                <AIInsight email={message} />
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

export default function EmailDetail({ email = {}, onBack, aiLoading = false }) {
  const [content, setContent] = useState(email.body || email.preview || '');
  const [htmlContent, setHtmlContent] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [attachmentsMessageId, setAttachmentsMessageId] = useState('');
  const [fullEmail, setFullEmail] = useState({});
  const [fullEmailMessageId, setFullEmailMessageId] = useState('');
  const [contentMessageId, setContentMessageId] = useState('');
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState('');
  const [threadMessages, setThreadMessages] = useState([]);
  const [expandedThreadMessageId, setExpandedThreadMessageId] = useState(
    email.gmailMessageId || email.id || ''
  );
  const [threadError, setThreadError] = useState('');
  const [downloadingAttachment, setDownloadingAttachment] = useState('');
  const requestIdRef = useRef(0);
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
  const messageId = email.gmailMessageId || email.id || email._id;

  const loadContent = useCallback(async () => {
    if (!messageId) return;

    const applyLoadedEmail = (emailObj) => {
      const html = emailObj.bodyHtml || emailObj.htmlBody || '';
      const text = emailObj.bodyText || emailObj.textBody || emailObj.content || emailObj.body || 'No message content.';
      setContent(text);
      setHtmlContent(html);
      setAttachments(emailObj.attachments || []);
      setAttachmentsMessageId(messageId);
      setFullEmail(emailObj);
      setFullEmailMessageId(messageId);
      setContentMessageId(messageId);
    };

    setThreadMessages([]);
    setThreadError('');

    if (email.threadId) {
      try {
        const { data } = await fetchEmailThread(email.threadId);
        const messages = data?.thread?.messages || [];
        if (messages.length > 1) {
          setThreadMessages(messages);
          setExpandedThreadMessageId(
            messages.some((item) => (item.gmailMessageId || item.id) === messageId)
              ? messageId
              : messages[messages.length - 1].gmailMessageId || messages[messages.length - 1].id
          );
          setContentLoading(false);
          return;
        }
        if (messages[0]) applyLoadedEmail(messages[0]);
      } catch (error) {
        console.warn('Failed to load email thread; using single email view:', error);
        setThreadError('Conversation could not be loaded. Showing this message only.');
      }
    }

    // If already loaded in prop
    if (email.hasFullBody && (email.bodyHtml || email.bodyText)) {
      setContent(email.bodyText || email.body || email.preview || 'No message content.');
      setHtmlContent(email.bodyHtml || '');
      setAttachments(email.attachments || []);
      setAttachmentsMessageId(messageId);
      setFullEmail(email);
      setFullEmailMessageId(messageId);
      setContentMessageId(messageId);
      setContentLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setContentLoading(true);
    setContentError('');
    try {
      const { data } = await fetchEmailById(messageId);
      if (requestId === requestIdRef.current) {
        const emailObj = data.email || data;
        applyLoadedEmail(emailObj);
      }
    } catch (error) {
      console.error('Failed to load full email content:', error);
      if (requestId === requestIdRef.current) {
        setContentError('Could not load the full message. Showing the available preview.');
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setContentLoading(false);
      }
    }
  }, [messageId, email]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const fallbackContent = email.body || email.preview || '';
  const displayedContent = contentMessageId === messageId ? content : fallbackContent;
  const safeHtml = useMemo(
    () => (contentMessageId === messageId ? sanitizeEmailHtml(htmlContent) : ''),
    [contentMessageId, htmlContent, messageId],
  );
  const recipient = fullEmailMessageId === messageId
    ? (fullEmail.recipient || email.recipient || 'your inbox')
    : (email.recipient || 'your inbox');
  const aiEmail = fullEmailMessageId === messageId ? { ...email, ...fullEmail } : email;

  const downloadAttachment = async (attachmentEmail, attachment) => {
    try {
      setDownloadingAttachment(attachment.attachmentId);
      const response = await downloadEmailAttachment(
        attachmentEmail.id || attachmentEmail._id || attachmentEmail.gmailMessageId,
        attachment.attachmentId
      );
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.filename || 'attachment';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setContentError('Could not download this attachment. Please try again.');
    } finally {
      setDownloadingAttachment('');
    }
  };

  const activeThreadMessage = threadMessages.find(
    (item) => (item.gmailMessageId || item.id) === expandedThreadMessageId
  ) || threadMessages[threadMessages.length - 1];

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
        <Clock3 size={14} /> Received {displayTime} · To {recipient}
      </div>
      <div className="pp-detail-grid">
        <article className="pp-message">
          {threadMessages.length > 1 ? (
            <ThreadMessages
              messages={threadMessages}
              expandedMessageId={expandedThreadMessageId}
              onExpand={setExpandedThreadMessageId}
              onDownload={downloadAttachment}
              downloadingAttachment={downloadingAttachment}
            />
          ) : contentLoading ? (
            <p className="pp-message-status"><LoaderCircle size={16} className="pp-spin" /> Loading full message...</p>
          ) : safeHtml ? (
            <div className="pp-message-content pp-message-html" dangerouslySetInnerHTML={{ __html: safeHtml }} />
          ) : (
            <p className="pp-message-content">{displayedContent || 'No message content.'}</p>
          )}
          {contentError && (
            <div className="pp-message-status pp-message-status--error">
              <span>{contentError}</span>
              <button type="button" onClick={loadContent} disabled={contentLoading} aria-label="Retry loading message">
                <RefreshCw size={14} /> Retry
              </button>
            </div>
          )}
          {threadMessages.length <= 1 && (
            <AttachmentList
              email={{ ...aiEmail, id: aiEmail.id || email.id }}
              onDownload={downloadAttachment}
              downloadingAttachment={downloadingAttachment}
            />
          )}
          {threadError && <div className="pp-message-status pp-message-status--error">{threadError}</div>}
          <div className="pp-reply-box">
            <span>Reply to {sender}...</span>
            <button className="button button--primary">
              <Reply size={14} /> Reply
            </button>
          </div>
        </article>
        {threadMessages.length > 1 ? (
          <AIInsight email={activeThreadMessage} loading={aiLoading} />
        ) : (
          <AIInsight email={aiEmail} loading={aiLoading} />
        )}
      </div>
    </section>
  );
}
