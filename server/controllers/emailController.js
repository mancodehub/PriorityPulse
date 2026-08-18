const Email = require("../models/Email");
const HttpError = require("../utils/httpError");
const asyncHandler = require("../utils/asyncHandler");

const getEmails = asyncHandler(async (req, res) => {
  const emails = await Email.find({ user: req.user._id })
    .sort({ receivedAt: -1, createdAt: -1 })
    .select("-__v");

  res.status(200).json({
    success: true,
    emails,
  });
});

const getEmailById = asyncHandler(async (req, res) => {
  const email = await Email.findOne({
    _id: req.params.id,
    user: req.user._id,
  }).select("-__v");

  if (!email) {
    throw new HttpError("Email not found", 404);
  }

  res.status(200).json({
    success: true,
    email,
  });
});

module.exports = {
  getEmails,
  getEmailById,
};
