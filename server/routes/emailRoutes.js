const express = require("express");

const {
  getEmails,
  getCustomKeywordEmails,
  getEmailAnalytics,
  getAIInsights,
  syncEmails,
  getEmailThread,
  downloadEmailAttachment,
  getEmailById,
  getEmailContent,
  markEmailAsRead,
  markEmailRead,
} = require("../controllers/emailController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Get emails from Redis/MongoDB (lightweight metadata for Inbox)
router.get("/", authMiddleware, getEmails);
router.get("/custom-keyword", authMiddleware, getCustomKeywordEmails);
router.get("/analytics", authMiddleware, getEmailAnalytics);
router.get("/ai-insights", authMiddleware, getAIInsights);

// Sync latest emails from Gmail → MongoDB → Redis
router.post("/sync", authMiddleware, syncEmails);

router.get("/thread/:threadId", authMiddleware, getEmailThread);
router.get("/:id/attachments/:attachmentId", authMiddleware, downloadEmailAttachment);

// Fetch full content on-demand when the user opens an individual email
router.get("/:id", authMiddleware, getEmailById);
router.get("/:id/content", authMiddleware, getEmailContent);

// Mark email as read independently without blocking
router.patch("/:id/read", authMiddleware, markEmailAsRead);

module.exports = router;
