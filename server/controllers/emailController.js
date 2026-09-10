const { google } = require("googleapis");
const User = require("../models/User");
const { classifyEmails } = require("../services/mlService");

function parseSender(fromHeader = "") {
  if (!fromHeader) return { sender: "Unknown", senderEmail: "" };

  const match = fromHeader.match(/^(.*?)\s*<(.+?)>$/);
  if (match) {
    const rawName = match[1].replace(/^["']|["']$/g, "").trim();
    const email = match[2].trim();
    return {
      sender: rawName || email.split("@")[0] || email,
      senderEmail: email,
    };
  }

  const trimmed = fromHeader.replace(/^["']|["']$/g, "").trim();
  return {
    sender: trimmed || "Unknown",
    senderEmail: trimmed,
  };
}

function formatEmailTime(dateStr) {
  if (!dateStr) return "";
  try {
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) return dateStr;

    const now = new Date();
    const isToday =
      parsed.getDate() === now.getDate() &&
      parsed.getMonth() === now.getMonth() &&
      parsed.getFullYear() === now.getFullYear();

    if (isToday) {
      return parsed.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    }

    if (parsed.getFullYear() === now.getFullYear()) {
      return parsed.toLocaleDateString([], { month: "short", day: "numeric" });
    }

    return parsed.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  } catch (e) {
    return dateStr;
  }
}

const getGmailClient = async (user) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: user.gmailAccessToken,
    refresh_token: user.gmailRefreshToken,
    expiry_date: user.gmailTokenExpiry
      ? new Date(user.gmailTokenExpiry).getTime()
      : undefined,
  });

  oauth2Client.on("tokens", async (tokens) => {
    try {
      if (tokens.access_token) {
        user.gmailAccessToken = tokens.access_token;
      }
      if (tokens.expiry_date) {
        user.gmailTokenExpiry = new Date(tokens.expiry_date);
      }
      if (tokens.refresh_token) {
        user.gmailRefreshToken = tokens.refresh_token;
      }
      await user.save();
    } catch (err) {
      console.error("Failed to persist refreshed Gmail token:", err.message);
    }
  });

  return google.gmail({
    version: "v1",
    auth: oauth2Client,
  });
};

const getEmails = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id || req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.gmailConnected || !user.gmailRefreshToken) {
      return res.status(400).json({
        success: false,
        message: "Gmail account is not connected",
      });
    }

    const gmail = await getGmailClient(user);

    const listResponse = await gmail.users.messages.list({
      userId: "me",
      labelIds: ["INBOX"],
      maxResults: 20,
    });

    const messages = listResponse.data.messages || [];

    const rawEmails = await Promise.all(
      messages.map(async (message) => {
        const response = await gmail.users.messages.get({
          userId: "me",
          id: message.id,
          format: "metadata",
          metadataHeaders: [
            "From",
            "To",
            "Subject",
            "Date",
          ],
        });

        const data = response.data;
        const headers = data.payload?.headers || [];

        const getHeader = (name) =>
          headers.find(
            (header) =>
              header.name.toLowerCase() === name.toLowerCase()
          )?.value || "";

        const fromHeader = getHeader("From");
        const { sender, senderEmail } = parseSender(fromHeader);
        const recipient = getHeader("To");
        const subject =
          getHeader("Subject") || "(No subject)";
        const date = getHeader("Date");
        const time = formatEmailTime(date);
        const preview = data.snippet || "";

        return {
          // Gmail information
          id: data.id,
          threadId: data.threadId,

          sender,
          senderEmail,
          rawSender: fromHeader,
          recipient,
          subject,
          date,
          time,

          // Data used by PriorityPulse UI
          preview,
          body: preview,

          // Read / unread (Gmail uses 'UNREAD' label)
          unread: (data.labelIds || []).includes("UNREAD"),
          labelIds: data.labelIds || [],
        };
      })
    );

    // Classify all fetched emails in a single batch using the Python ML pipeline
    const predictions = await classifyEmails(rawEmails);

    const emails = rawEmails.map((email, idx) => {
      const pred = predictions[idx] || {};
      const priority = pred.priority || "MEDIUM";
      const confidence = typeof pred.confidence === "number" ? pred.confidence : 75;
      const confidence_score = typeof pred.confidence_score === "number" ? pred.confidence_score : 0.75;
      const reasons = Array.isArray(pred.reasons) && pred.reasons.length > 0
        ? pred.reasons
        : [
            `Classified as ${priority} priority.`,
            "AI analyzed subject, sender, and content."
          ];
      const important = priority === "HIGH";

      return {
        ...email,
        priority,
        confidence,
        confidence_score,
        reasons,
        important,
      };
    });

    return res.status(200).json({
      success: true,
      count: emails.length,
      emails,
    });
  } catch (error) {
    console.error(
      "Get Gmail emails error:",
      error
    );

    next(error);
  }
};

module.exports = {
  getEmails,
};