const { redisClient } = require("../config/redis");

const CACHE_TTL = 5 * 60; // 5 minutes

const getEmailCacheKey = (userId) => {
  return `prioritypulse:emails:${userId}`;
};

const getCachedEmails = async (userId) => {
  const key = getEmailCacheKey(userId);

  const cached = await redisClient.get(key);

  if (!cached) {
    return null;
  }

  return JSON.parse(cached);
};

const setCachedEmails = async (userId, emails) => {
  const key = getEmailCacheKey(userId);

  await redisClient.set(
    key,
    JSON.stringify(emails),
    {
      EX: CACHE_TTL,
    }
  );
};

const updateCachedEmailReadState = async (userId, emailId, unread) => {
  const key = getEmailCacheKey(userId);
  const cached = await redisClient.get(key);
  if (!cached) return false;

  const emails = JSON.parse(cached);
  if (!Array.isArray(emails)) return false;

  let updated = false;
  const nextEmails = emails.map((email) => {
    const cachedId = email.gmailMessageId || email.id || email._id?.toString();
    if (cachedId !== emailId) return email;
    updated = true;
    return { ...email, unread };
  });

  if (updated) {
    await redisClient.set(key, JSON.stringify(nextEmails), { EX: CACHE_TTL });
  }
  return updated;
};

const deleteCachedEmails = async (userId) => {
  const key = getEmailCacheKey(userId);

  await redisClient.del(key);
};

const BODY_CACHE_TTL = 60 * 60; // 1 hour

const getEmailBodyCacheKey = (userId, messageId) => {
  return `prioritypulse:email:${userId}:${messageId}`;
};

const getCachedEmailBody = async (userId, messageId) => {
  try {
    const key = getEmailBodyCacheKey(userId, messageId);
    const cached = await redisClient.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    console.warn("[BodyCache] Redis get error:", err.message);
    return null;
  }
};

const setCachedEmailBody = async (userId, messageId, emailData) => {
  try {
    const key = getEmailBodyCacheKey(userId, messageId);
    await redisClient.set(key, JSON.stringify(emailData), {
      EX: BODY_CACHE_TTL,
    });
  } catch (err) {
    console.warn("[BodyCache] Redis set error:", err.message);
  }
};

module.exports = {
  getEmailCacheKey,
  getCachedEmails,
  setCachedEmails,
  updateCachedEmailReadState,
  deleteCachedEmails,
  getEmailBodyCacheKey,
  getCachedEmailBody,
  setCachedEmailBody,
};
