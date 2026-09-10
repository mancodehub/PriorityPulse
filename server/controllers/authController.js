const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const HttpError = require("../utils/httpError");
const asyncHandler = require("../utils/asyncHandler");
const { sendOtpEmail } = require("../config/email");

// ==========================================
// DEVELOPMENT OTP STORE
// ==========================================
// For development/testing only.
// In production, use MongoDB/Redis with expiry.
const otpStore = new Map();

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

// ==========================================
// GENERATE 6 DIGIT OTP
// ==========================================
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ==========================================
// POST /api/auth/send-otp
// ==========================================
const sendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new HttpError("Email is required", 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(normalizedEmail)) {
    throw new HttpError("Please enter a valid email address", 400);
  }

  const otp = generateOtp();

  const hashedOtp = await bcrypt.hash(otp, 10);

  otpStore.set(normalizedEmail, {
    hashedOtp,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
  });

  await sendOtpEmail(normalizedEmail, otp);

  console.log(`OTP email sent to ${normalizedEmail}`);

  return res.status(200).json({
    success: true,
    message: "OTP sent successfully",
  });
});

// ==========================================
// POST /api/auth/verify-otp
// ==========================================
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new HttpError("Email and OTP are required", 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  const storedOtp = otpStore.get(normalizedEmail);

  if (!storedOtp) {
    throw new HttpError(
      "OTP not found. Please request a new code.",
      400
    );
  }

  // Check expiration
  if (Date.now() > storedOtp.expiresAt) {
    otpStore.delete(normalizedEmail);

    throw new HttpError(
      "OTP has expired. Please request a new code.",
      400
    );
  }

  // Compare OTP
  const isValidOtp = await bcrypt.compare(
    otp.toString(),
    storedOtp.hashedOtp
  );

  if (!isValidOtp) {
    throw new HttpError("Invalid OTP", 400);
  }

  // OTP can only be used once
  otpStore.delete(normalizedEmail);

  // Find existing user or create new user
  let user = await User.findOne({
    email: normalizedEmail,
  });

  if (!user) {
    user = await User.create({
      email: normalizedEmail,
      lastLoginAt: new Date(),
    });
  } else {
    user.lastLoginAt = new Date();
    await user.save();
  }

  // Create JWT
  const token = jwt.sign(
    {
      userId: user._id.toString(),
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

  return res.status(200).json({
    success: true,
    message: "Login successful",
    token,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
    },
  });
});

// ==========================================
// GET /api/auth/me
// ==========================================
const getMe = asyncHandler(async (req, res) => {
  // req.user comes from authMiddleware
  return res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      gmailConnected: req.user.gmailConnected,
      googleEmail: req.user.googleEmail,
    },
  });
});

// ==========================================
// EXPORT CONTROLLERS
// ==========================================
module.exports = {
  sendOtp,
  verifyOtp,
  getMe,
};