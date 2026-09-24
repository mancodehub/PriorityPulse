const CustomKeyword = require("../models/CustomKeyword");
const Email = require("../models/Email");
const { redisClient } = require("../config/redis");

const KEYWORD_CACHE_TTL = 10 * 60;
const VALID_PRIORITIES = ["HIGH", "MEDIUM", "LOW"];

const getKeywordCacheKey = (userId) => `prioritypulse:keywords:${userId}`;

const normalizeKeyword = (keyword) => String(keyword || "").trim().toLowerCase();

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getActiveKeywords = async (userId) => {
  const userIdString = userId.toString();
  const cacheKey = getKeywordCacheKey(userIdString);

  if (redisClient.isOpen) {
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (error) {
      console.warn(`[Keywords] Redis read warning for user ${userIdString}: ${error.message}`);
    }
  }

  const keywords = await CustomKeyword.find({ userId, enabled: true })
    .select("keyword normalizedKeyword priority")
    .sort({ priority: 1, keyword: 1 })
    .lean();

  if (redisClient.isOpen) {
    try {
      await redisClient.set(cacheKey, JSON.stringify(keywords), { EX: KEYWORD_CACHE_TTL });
    } catch (error) {
      console.warn(`[Keywords] Redis write warning for user ${userIdString}: ${error.message}`);
    }
  }
  return keywords;
};

const invalidateKeywordCache = async (userId) => {
  if (!redisClient.isOpen) return;
  try {
    await redisClient.del(getKeywordCacheKey(userId.toString()));
  } catch (error) {
    console.warn(`[Keywords] Redis invalidation warning for user ${userId}: ${error.message}`);
  }
};

const keywordMatchesText = (keyword, text) => {
  const normalized = normalizeKeyword(keyword);
  if (!normalized) return false;

  const escaped = escapeRegex(normalized).replace(/\s+/g, "\\s+");
  const pattern = new RegExp(`(^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`, "i");
  return pattern.test(text);
};

const matchCustomKeywords = (keywords, subject = "", body = "") => {
  const text = `${subject} ${body}`.trim();
  const matches = { HIGH: [], MEDIUM: [], LOW: [] };

  for (const item of keywords || []) {
    const keyword = normalizeKeyword(item.normalizedKeyword || item.keyword);
    const bucket = VALID_PRIORITIES.includes(item.priority) ? item.priority : "LOW";
    if (keyword && keywordMatchesText(keyword, text) && !matches[bucket].includes(keyword)) {
      matches[bucket].push(keyword);
    }
  }

  return matches;
};

const applyPriorityDecision = (mlPrediction, matches) => {
  const mlPriority = VALID_PRIORITIES.includes(mlPrediction?.priority)
    ? mlPrediction.priority
    : "MEDIUM";
  const matchedKeywords = ["HIGH", "MEDIUM", "LOW"].flatMap((priority) =>
    matches[priority].map((keyword) => ({ keyword, priority }))
  );
  return {
    priority: mlPriority,
    important: mlPriority === "HIGH",
    mlPriority,
    mlConfidence: typeof mlPrediction?.confidence === "number" ? mlPrediction.confidence : null,
    confidence: typeof mlPrediction?.confidence === "number" ? mlPrediction.confidence : null,
    aiReasons: [
      ...(Array.isArray(mlPrediction?.aiReasons) ? mlPrediction.aiReasons : []),
    ],
    matchedKeywords,
  };
};

const refreshStoredEmailMatches = async (userId) => {
  const keywords = await getActiveKeywords(userId);
  const emails = await Email.find({ userId }).select("_id subject body bodyText preview").lean();
  if (!emails.length) return { checked: 0, matched: 0 };

  const operations = emails.map((email) => {
    const matches = matchCustomKeywords(keywords, email.subject, email.bodyText || email.body || email.preview);
    const matchedKeywords = ["HIGH", "MEDIUM", "LOW"].flatMap((priority) =>
      matches[priority].map((keyword) => ({ keyword, priority }))
    );
    return { updateOne: { filter: { _id: email._id, userId }, update: { $set: { matchedKeywords } } } };
  });
  await Email.bulkWrite(operations, { ordered: false });
  return { checked: emails.length, matched: operations.length };
};

module.exports = {
  VALID_PRIORITIES,
  normalizeKeyword,
  getActiveKeywords,
  invalidateKeywordCache,
  matchCustomKeywords,
  applyPriorityDecision,
  refreshStoredEmailMatches,
};
