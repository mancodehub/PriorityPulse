const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Otp = require("../models/Otp");
const HttpError = require("../utils/httpError");
const asyncHandler = require("../utils/asyncHandler");

const OTP_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES || 10);
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (email = "") => email.trim().toLowerCase();

const signToken = (user) =>
  jwt.sign({ userId: user._id.toString(), email: user.email }, process.env.JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

const sendOtp = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);

  if (!emailRegex.test(email)) {
    throw new HttpError("Enter a valid email address.", 400);
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await Otp.deleteMany({ email, consumedAt: null });
  await Otp.create({ email, codeHash, expiresAt });

  const response = {
    success: true,
    message: "OTP sent successfully.",
  };

  if (process.env.NODE_ENV !== "production") {
    response.otp = otp;
  }

  res.status(200).json(response);
});

const verifyOtp = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const otp = String(req.body.otp || "").trim();

  if (!emailRegex.test(email)) {
    throw new HttpError("Enter a valid email address.", 400);
  }

  if (!/^\d{6}$/.test(otp)) {
    throw new HttpError("Enter a valid 6-digit OTP.", 400);
  }

  const otpRecord = await Otp.findOne({
    email,
    consumedAt: null,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!otpRecord) {
    throw new HttpError("OTP is invalid or has expired.", 400);
  }

  if (otpRecord.attempts >= 5) {
    throw new HttpError("Too many OTP attempts. Request a new code.", 429);
  }

  const isMatch = await bcrypt.compare(otp, otpRecord.codeHash);
  otpRecord.attempts += 1;

  if (!isMatch) {
    await otpRecord.save();
    throw new HttpError("OTP is invalid or has expired.", 400);
  }

  otpRecord.consumedAt = new Date();
  await otpRecord.save();

  const user = await User.findOneAndUpdate(
    { email },
    { $set: { lastLoginAt: new Date() }, $setOnInsert: { email } },
    { new: true, upsert: true, runValidators: true }
  ).select("-__v");

  const token = signToken(user);

  res.status(200).json({
    success: true,
    token,
    user,
  });
});

const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

module.exports = {
  sendOtp,
  verifyOtp,
  getMe,
};
