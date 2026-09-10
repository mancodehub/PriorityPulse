const jwt = require("jsonwebtoken");
const { google } = require("googleapis");

const User = require("../models/User");
const { createOAuthClient } = require("../config/gmail");

// ==========================================
// START GOOGLE OAUTH
// ==========================================
const connectGmail = async (req, res, next) => {
  try {
    const oauth2Client = createOAuthClient();

    const userId = req.user?.id || req.user?._id || req.user?.userId;

    // Short-lived state token to identify
    // which PriorityPulse user is connecting Gmail
    const state = jwt.sign(
      { userId: userId.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",

      scope: [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/userinfo.email",
      ],

      state,
    });

    return res.json({
      success: true,
      authUrl,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GOOGLE OAUTH CALLBACK
// ==========================================
const gmailCallback = async (req, res) => {
  const clientUrl = (
    process.env.CLIENT_URL || "http://localhost:5173"
  ).replace(/\/$/, "");

  try {
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      console.warn("Google OAuth was denied or returned error:", oauthError);
      return res.redirect(`${clientUrl}/dashboard?gmail=error`);
    }

    if (!code || !state) {
      return res.status(400).json({
        success: false,
        message: "Missing Google authorization data.",
      });
    }

    // Verify which PriorityPulse user started OAuth
    const decoded = jwt.verify(
      state,
      process.env.JWT_SECRET
    );

    const oauth2Client = createOAuthClient();

    // Exchange Google authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    oauth2Client.setCredentials(tokens);

    // Get connected Google account information
    const oauth2 = google.oauth2({
      version: "v2",
      auth: oauth2Client,
    });

    const { data } = await oauth2.userinfo.get();

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "PriorityPulse user not found.",
      });
    }

    // Save Gmail connection
    user.gmailConnected = true;
    user.googleEmail = data.email;

    if (tokens.access_token) {
      user.gmailAccessToken = tokens.access_token;
    }

    if (tokens.refresh_token) {
      user.gmailRefreshToken = tokens.refresh_token;
    }

    if (tokens.expiry_date) {
      user.gmailTokenExpiry = new Date(tokens.expiry_date);
    }

    await user.save();

    // Redirect back to dashboard
    return res.redirect(
      `${clientUrl}/dashboard?gmail=connected`
    );
  } catch (error) {
    console.error(
      "Gmail OAuth callback error:",
      error.message
    );

    return res.redirect(
      `${clientUrl}/dashboard?gmail=error`
    );
  }
};

// ==========================================
// GET GMAIL STATUS
// ==========================================
const getGmailStatus = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user?.userId;

    const user = await User.findById(userId).select(
      "gmailConnected googleEmail"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.json({
      success: true,
      gmailConnected: Boolean(user.gmailConnected),
      googleEmail: user.googleEmail,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// DISCONNECT GMAIL
// ==========================================
const disconnectGmail = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user?.userId;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        gmailConnected: false,
        googleEmail: null,
        gmailAccessToken: null,
        gmailRefreshToken: null,
        gmailTokenExpiry: null,
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.json({
      success: true,
      message: "Gmail disconnected successfully.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  connectGmail,
  gmailCallback,
  getGmailStatus,
  disconnectGmail,
};