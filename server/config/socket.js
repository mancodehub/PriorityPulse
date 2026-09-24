const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let io = null;

/**
 * Initializes the Socket.io server attached to the Node.js HTTP server.
 *
 * @param {import("http").Server} httpServer
 * @returns {import("socket.io").Server}
 */
const initSocketServer = (httpServer) => {
  if (io) {
    return io;
  }

  const allowedOrigin = process.env.CLIENT_URL || "http://localhost:5173";

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigin,
      credentials: true,
      methods: ["GET", "POST"],
    },
    pingTimeout: 30000,
    pingInterval: 25000,
  });

  console.log("[Socket] Server initialized");

  // Authentication middleware using existing JWT verification
  io.use((socket, next) => {
    try {
      const rawToken =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization;

      if (!rawToken) {
        return next(new Error("Authentication token required"));
      }

      const token = rawToken.startsWith("Bearer ")
        ? rawToken.slice(7).trim()
        : rawToken.trim();

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (!payload || !payload.userId) {
        return next(new Error("Invalid token payload"));
      }

      socket.userId = payload.userId.toString();
      next();
    } catch (err) {
      // Do NOT log the raw token
      console.warn("[Socket] Authentication failed:", err.message);
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const roomName = `user:${socket.userId}`;
    socket.join(roomName);

    console.log(`[Socket] User connected: ${socket.userId}`);
    console.log(`[Socket] User joined room: user:${socket.userId}`);

    socket.on("disconnect", () => {
      console.log(`[Socket] User disconnected: ${socket.userId}`);
    });
  });

  return io;
};

/**
 * Returns the current Socket.io instance if initialized.
 */
const getSocketServer = () => io;

/**
 * Emits real-time email events to a specific user's private socket room.
 * - Always emits "new-email" with full email details.
 * - If priority is "HIGH", additionally emits "high-priority-email".
 *
 * @param {string} userId
 * @param {Object} emailData
 */
const emitNewEmailToUser = (userId, emailData) => {
  if (!io) {
    return;
  }

  try {
    const targetUserId = userId.toString();
    const roomName = `user:${targetUserId}`;
    const emailId = emailData.id || emailData.gmailMessageId;

    // Full clean payload for Inbox list updating
    const payload = {
      id: emailId,
      gmailMessageId: emailData.gmailMessageId || emailId,
      threadId: emailData.threadId || null,
      sender: emailData.sender || "",
      recipient: emailData.recipient || "",
      subject: emailData.subject || "(No subject)",
      preview: emailData.preview || "",
      date: emailData.date || new Date().toISOString(),
      unread: typeof emailData.unread === "boolean" ? emailData.unread : true,
      priority: emailData.priority || "MEDIUM",
      confidence: typeof emailData.confidence === "number" ? emailData.confidence : null,
      aiReasons: Array.isArray(emailData.aiReasons) ? emailData.aiReasons : [],
      matchedKeywords: Array.isArray(emailData.matchedKeywords) ? emailData.matchedKeywords : [],
      attachments: Array.isArray(emailData.attachments) ? emailData.attachments : [],
      important: emailData.priority === "HIGH",
      gmailLabels: emailData.gmailLabels || [],
    };

    // 1. Emit "new-email" event to the user's private room
    io.to(roomName).emit("new-email", payload);
    console.log(`[Socket] New email emitted: ${payload.id}`);

    if (payload.matchedKeywords.length > 0) {
      io.to(roomName).emit("custom-keyword-match", {
        id: payload.id,
        subject: payload.subject,
        sender: payload.sender,
        priority: payload.priority,
        matchedKeywords: payload.matchedKeywords,
        unread: payload.unread,
        date: payload.date,
      });
    }

    // 2. For HIGH priority emails, additionally emit "high-priority-email"
    if (payload.priority === "HIGH") {
      const highPriorityPayload = {
        id: payload.id,
        subject: payload.subject,
        sender: payload.sender,
        priority: payload.priority,
        confidence: payload.confidence,
        aiReasons: payload.aiReasons,
      };

      io.to(roomName).emit("high-priority-email", highPriorityPayload);
      console.log(`[Socket] High priority notification emitted: ${payload.id}`);
    }
  } catch (emitErr) {
    console.error("[Socket] Notification failed:", emitErr.message);
  }
};

const emitEmailUpdatedToUser = (userId, emailData) => {
  if (!io) return;

  const roomName = `user:${userId.toString()}`;
  io.to(roomName).emit("email-updated", {
    id: emailData.id || emailData.gmailMessageId,
    gmailMessageId: emailData.gmailMessageId,
    unread: Boolean(emailData.unread),
  });
};

module.exports = {
  initSocketServer,
  getSocketServer,
  emitNewEmailToUser,
  emitEmailUpdatedToUser,
};
