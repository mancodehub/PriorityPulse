const mongoose = require("mongoose");
const CustomKeyword = require("../models/CustomKeyword");
const User = require("../models/User");
const { syncUserEmails } = require("../services/emailSyncService");
const {
  VALID_PRIORITIES,
  normalizeKeyword,
  invalidateKeywordCache,
  refreshStoredEmailMatches,
} = require("../services/customKeywordService");

const normalizePriority = (priority) => String(priority || "").trim().toUpperCase();

const validateKeywordInput = (keyword, priority) => {
  const normalizedKeyword = normalizeKeyword(keyword);
  const normalizedPriority = normalizePriority(priority || "LOW");
  if (!normalizedKeyword) return { error: "Keyword cannot be empty" };
  if (normalizedKeyword.length > 120) return { error: "Keyword must be 120 characters or fewer" };
  if (!VALID_PRIORITIES.includes(normalizedPriority)) return { error: "Priority must be HIGH, MEDIUM, or LOW" };
  return { normalizedKeyword, normalizedPriority };
};

const getKeywords = async (req, res, next) => {
  try {
    const keywords = await CustomKeyword.find({ userId: req.user._id })
      .sort({ priority: 1, keyword: 1 })
      .lean();
    return res.status(200).json({ success: true, keywords });
  } catch (error) {
    next(error);
  }
};

const createKeyword = async (req, res, next) => {
  try {
    if (req.body?.enabled !== undefined && typeof req.body.enabled !== "boolean") {
      return res.status(400).json({ success: false, message: "Enabled must be a boolean" });
    }

    const validated = validateKeywordInput(req.body?.keyword, req.body?.priority);
    if (validated.error) return res.status(400).json({ success: false, message: validated.error });

    const keyword = await CustomKeyword.create({
      userId: req.user._id,
      keyword: validated.normalizedKeyword,
      normalizedKeyword: validated.normalizedKeyword,
      priority: validated.normalizedPriority,
      enabled: req.body?.enabled !== false,
    });
    await invalidateKeywordCache(req.user._id);
    await refreshStoredEmailMatches(req.user._id);
    return res.status(201).json({ success: true, keyword });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "This keyword already exists" });
    }
    next(error);
  }
};

const updateKeyword = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid keyword ID" });
    }

    const existing = await CustomKeyword.findOne({ _id: req.params.id, userId: req.user._id });
    if (!existing) return res.status(404).json({ success: false, message: "Keyword not found" });

    const nextKeyword = req.body?.keyword === undefined ? existing.keyword : req.body.keyword;
    const nextPriority = req.body?.priority === undefined ? existing.priority : req.body.priority;
    const validated = validateKeywordInput(nextKeyword, nextPriority);
    if (validated.error) return res.status(400).json({ success: false, message: validated.error });

    existing.keyword = validated.normalizedKeyword;
    existing.normalizedKeyword = validated.normalizedKeyword;
    existing.priority = validated.normalizedPriority;
    if (req.body?.enabled !== undefined) {
      if (typeof req.body.enabled !== "boolean") {
        return res.status(400).json({ success: false, message: "Enabled must be a boolean" });
      }
      existing.enabled = req.body.enabled;
    }
    await existing.save();
    await invalidateKeywordCache(req.user._id);
    await refreshStoredEmailMatches(req.user._id);
    return res.status(200).json({ success: true, keyword: existing });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "This keyword already exists" });
    }
    next(error);
  }
};

const deleteKeyword = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid keyword ID" });
    }
    const deleted = await CustomKeyword.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!deleted) return res.status(404).json({ success: false, message: "Keyword not found" });
    await invalidateKeywordCache(req.user._id);
    await refreshStoredEmailMatches(req.user._id);
    return res.status(200).json({ success: true, id: req.params.id });
  } catch (error) {
    next(error);
  }
};

const refreshKeywordMatches = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user?.gmailConnected && user.gmailRefreshToken) {
      await syncUserEmails(user);
    }
    const result = await refreshStoredEmailMatches(req.user._id);
    await invalidateKeywordCache(req.user._id);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getKeywords,
  createKeyword,
  updateKeyword,
  deleteKeyword,
  refreshKeywordMatches,
};
