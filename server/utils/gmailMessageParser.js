/**
 * Safely decodes a Base64URL encoded string into UTF-8 text.
 * Gmail message bodies use URL-safe Base64 (RFC 4648).
 *
 * @param {string} data
 * @returns {string}
 */
const decodeBase64Url = (data) => {
  if (!data || typeof data !== "string") {
    return "";
  }

  try {
    return Buffer.from(data, "base64url").toString("utf8");
  } catch (err) {
    try {
      // Fallback: convert URL-safe characters manually
      const standardBase64 = data.replace(/-/g, "+").replace(/_/g, "/");
      return Buffer.from(standardBase64, "base64").toString("utf8");
    } catch (fallbackErr) {
      console.warn("[MIME Parser] Failed to decode base64 body:", fallbackErr.message);
      return "";
    }
  }
};

/**
 * Extracts a specific header value by case-insensitive name.
 *
 * @param {Array} headers
 * @param {string} name
 * @returns {string}
 */
const getHeader = (headers = [], name) => {
  if (!Array.isArray(headers)) return "";
  const found = headers.find(
    (h) => h.name && h.name.toLowerCase() === name.toLowerCase()
  );
  return found ? found.value || "" : "";
};

/**
 * Recursively parses a Gmail message payload to extract plain text, HTML body,
 * and attachment metadata from arbitrary nested MIME structures.
 *
 * @param {Object} message - Raw message object from users.messages.get({ format: "full" })
 * @returns {{
 *   sender: string,
 *   recipient: string,
 *   cc: string,
 *   bcc: string,
 *   subject: string,
 *   date: string,
 *   textBody: string,
 *   htmlBody: string,
 *   attachments: Array<{ attachmentId: string, filename: string, mimeType: string, size: number }>,
 *   threadId: string,
 *   gmailLabels: Array<string>
 * }}
 */
const parseGmailMessage = (message) => {
  if (!message || !message.payload) {
    return {
      sender: "",
      recipient: "",
      cc: "",
      bcc: "",
      subject: "(No subject)",
      date: "",
      textBody: "",
      htmlBody: "",
      attachments: [],
      threadId: message?.threadId || null,
      gmailLabels: message?.labelIds || [],
    };
  }

  const payload = message.payload;
  const headers = payload.headers || [];

  const sender = getHeader(headers, "From");
  const recipient = getHeader(headers, "To");
  const cc = getHeader(headers, "Cc");
  const bcc = getHeader(headers, "Bcc");
  const subject = getHeader(headers, "Subject") || "(No subject)";
  const dateHeader = getHeader(headers, "Date");

  let htmlBody = "";
  let textBody = "";
  const attachments = [];

  /**
   * Recursive walker across MIME parts
   */
  const walkParts = (part) => {
    if (!part) return;

    const mimeType = (part.mimeType || "").toLowerCase();
    const filename = part.filename ? part.filename.trim() : "";
    const body = part.body || {};
    const attachmentId = body.attachmentId || "";

    // 1. Check if this part is an attachment
    // (Has a filename or an explicit attachmentId without being inline text)
    const isAttachment =
      filename.length > 0 ||
      (attachmentId && !mimeType.startsWith("text/"));

    if (isAttachment) {
      attachments.push({
        attachmentId: attachmentId || "",
        filename: filename || "attachment",
        mimeType: part.mimeType || "application/octet-stream",
        size: typeof body.size === "number" ? body.size : 0,
      });
    }

    // 2. Extract content bodies if present
    if (body.data) {
      if (mimeType === "text/html") {
        const decoded = decodeBase64Url(body.data);
        if (decoded) {
          htmlBody = htmlBody ? `${htmlBody}\n${decoded}` : decoded;
        }
      } else if (mimeType === "text/plain" && !isAttachment) {
        const decoded = decodeBase64Url(body.data);
        if (decoded) {
          textBody = textBody ? `${textBody}\n${decoded}` : decoded;
        }
      }
    }

    // 3. Recursively inspect nested child parts
    if (Array.isArray(part.parts) && part.parts.length > 0) {
      for (const childPart of part.parts) {
        walkParts(childPart);
      }
    }
  };

  walkParts(payload);

  // Fallback if neither htmlBody nor textBody was found in parts
  if (!htmlBody && !textBody) {
    if (payload.body && payload.body.data) {
      const decoded = decodeBase64Url(payload.body.data);
      if ((payload.mimeType || "").toLowerCase() === "text/html") {
        htmlBody = decoded;
      } else {
        textBody = decoded;
      }
    } else if (message.snippet) {
      textBody = message.snippet;
    }
  }

  return {
    sender,
    recipient,
    cc,
    bcc,
    subject,
    date: dateHeader || (message.internalDate ? new Date(Number(message.internalDate)).toISOString() : ""),
    textBody: textBody.trim(),
    htmlBody: htmlBody.trim(),
    attachments,
    threadId: message.threadId || null,
    gmailLabels: Array.isArray(message.labelIds) ? message.labelIds : [],
  };
};

module.exports = {
  decodeBase64Url,
  getHeader,
  parseGmailMessage,
};
