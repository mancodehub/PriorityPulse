const express = require("express");

const {
  connectGmail,
  gmailCallback,
  getGmailStatus,
  disconnectGmail,
} = require("../controllers/gmailController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// START GMAIL CONNECTION
// ==========================================
// User must be logged in
router.get(
  "/connect",
  authMiddleware,
  connectGmail
);

// ==========================================
// GOOGLE OAUTH CALLBACK
// ==========================================
// Google redirects here after user अनुमति/permission
router.get(
  "/callback",
  gmailCallback
);

// ==========================================
// CHECK GMAIL CONNECTION STATUS
// ==========================================
// User must be logged in
router.get(
  "/status",
  authMiddleware,
  getGmailStatus
);

// ==========================================
// DISCONNECT GMAIL
// ==========================================
// User must be logged in
router.post(
  "/disconnect",
  authMiddleware,
  disconnectGmail
);

module.exports = router;