const { google } = require("googleapis");
const crypto = require("crypto");
const User = require("../models/User");
const Email = require("../models/Email");
const { classifyEmailsBatch } = require("./emailClassificationService");
const { redisClient } = require("../config/redis");
const { setCachedEmails } = require("./emailCacheService");
const { parseGmailMessage } = require("../utils/gmailMessageParser");
const {
  getActiveKeywords,
  matchCustomKeywords,
  applyPriorityDecision,
} = require("./customKeywordService");

// Per-user sync lock to prevent duplicate concurrent synchronizations
const activeSyncLocks = new Set();
const distributedLockTokens = new Map();
const SYNC_LOCK_TTL_SECONDS = 5 * 60;

const getSyncLockKey = (userId) => `prioritypulse:sync-lock:${userId}`;

const acquireSyncLock = async (userId) => {
  const userIdStr = userId.toString();
  if (activeSyncLocks.has(userIdStr)) return false;

  if (redisClient.isOpen) {
    try {
      const token = crypto.randomUUID();
      const acquired = await redisClient.set(getSyncLockKey(userIdStr), token, {
        NX: true,
        EX: SYNC_LOCK_TTL_SECONDS,
      });
      if (acquired !== "OK") return false;
      distributedLockTokens.set(userIdStr, token);
    } catch (error) {
      console.warn(`[Sync] Redis lock unavailable for user ${userIdStr}: ${error.message}`);
    }
  }

  activeSyncLocks.add(userIdStr);
  return true;
};

const releaseSyncLock = async (userId) => {
  const userIdStr = userId.toString();
  activeSyncLocks.delete(userIdStr);

  const token = distributedLockTokens.get(userIdStr);
  distributedLockTokens.delete(userIdStr);
  if (!token || !redisClient.isOpen) return;

  try {
    await redisClient.eval(
      "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
      { keys: [getSyncLockKey(userIdStr)], arguments: [token] }
    );
  } catch (error) {
    console.warn(`[Sync] Redis lock release warning for user ${userIdStr}: ${error.message}`);
  }
};

const isUserSyncing = (userId) => {
  return activeSyncLocks.has(userId.toString());
};

const getGmailClient = (user) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: user.gmailAccessToken,
    refresh_token: user.gmailRefreshToken,
    expiry_date: user.gmailTokenExpiry
      ? new Date(user.gmailTokenExpiry).getTime()
      : undefined,
  });

  return google.gmail({
    version: "v1",
    auth: oauth2Client,
  });
};

const getHeader = (headers, name) => {
  return (
    headers.find(
      (header) => header.name.toLowerCase() === name.toLowerCase()
    )?.value || ""
  );
};

/**
 * Executes an async mapper across an array with a controlled concurrency limit.
 *
 * @param {Array} items
 * @param {number} limit
 * @param {Function} fn
 * @returns {Promise<Array>}
 */
const mapConcurrent = async (items, limit, fn) => {
  const results = new Array(items.length);
  let currentIndex = 0;

  const workerCount = Math.min(limit, items.length);
  const workers = new Array(workerCount).fill(0).map(async () => {
    while (currentIndex < items.length) {
      const index = currentIndex++;
      results[index] = await fn(items[index], index);
    }
  });

  await Promise.all(workers);
  return results;
};

const getMessageIdsToSync = async (gmail, user, logPrefix) => {
  let profile;
  try {
    profile = await gmail.users.getProfile({ userId: "me" });
  } catch (error) {
    console.warn(`${logPrefix} Gmail profile lookup failed; using inbox listing: ${error.message}`);
  }

  const currentHistoryId = profile?.data?.historyId || null;
  const messageIds = new Set();
  let usedHistory = false;

  if (user.gmailHistoryId) {
    try {
      let pageToken;
      do {
        const response = await gmail.users.history.list({
          userId: "me",
          startHistoryId: user.gmailHistoryId,
          historyTypes: ["messageAdded", "labelAdded", "labelRemoved"],
          pageToken,
        });
        for (const historyItem of response.data.history || []) {
          for (const entry of [
            ...(historyItem.messagesAdded || []),
            ...(historyItem.labelsAdded || []),
            ...(historyItem.labelsRemoved || []),
          ]) {
            if (entry.message?.id) messageIds.add(entry.message.id);
          }
        }
        pageToken = response.data.nextPageToken;
      } while (pageToken);
      usedHistory = true;
    } catch (error) {
      // Gmail history expires periodically; a bounded inbox rescan safely re-seeds it.
      console.warn(`${logPrefix} Gmail history unavailable; falling back to inbox listing: ${error.message}`);
    }
  }

  if (!usedHistory || !user.gmailHistoryId) {
    const listResponse = await gmail.users.messages.list({
      userId: "me",
      labelIds: ["INBOX"],
      maxResults: 20,
    });
    for (const message of listResponse.data.messages || []) {
      if (message.id) messageIds.add(message.id);
    }
  }

  return { messageIds: [...messageIds], currentHistoryId };
};

/**
 * Synchronizes the latest 20 Gmail emails for the given user:
 * 1. Controlled concurrency (5) for Gmail metadata fetching
 * 2. Checks MongoDB first — skips ML classification for emails that already exist
 * 3. Classifies ONLY new emails via Python ML microservice batch endpoint
 * 4. Tracks and returns newly detected emails (for notification hooks / Socket.io)
 * 5. Multi-document atomic bulkWrite for MongoDB updates and inserts
 * 6. Single Redis cache write for fast Inbox retrieval
 *
 * @param {Object} user
 * @param {Object} [options]
 * @param {boolean} [options.isBackground=false]
 * @returns {Promise<{ syncedCount: number, newEmails: Array, emails: Array, alreadyRunning?: boolean }>}
 */
const syncUserEmails = async (user, options = {}) => {
  const userIdStr = user._id.toString();
  const isBackground = Boolean(options.isBackground);
  const logPrefix = isBackground ? "[BackgroundSync]" : "[Sync]";

  // Guard against duplicate syncs for the same user, including other processes.
  if (!(await acquireSyncLock(userIdStr))) {
    console.log(
      `${logPrefix} Sync already in progress for user ${userIdStr}. Skipping duplicate.`
    );
    const existingEmails = await Email.find({ userId: user._id })
      .sort({ date: -1 })
      .limit(20)
      .lean();

    return {
      syncedCount: 0,
      newEmails: [],
      emails: existingEmails,
      alreadyRunning: true,
    };
  }

  const syncStart = Date.now();
  console.log(`${logPrefix} Started for user ${userIdStr}`);

  try {
    if (!user.gmailRefreshToken) {
      throw new Error("No Gmail refresh token found for user. Please reconnect Gmail.");
    }

    const gmail = getGmailClient(user);

    // 1. Use Gmail history when available; seed new users with a bounded inbox listing.
    const listStart = Date.now();
    const changeSet = await getMessageIdsToSync(gmail, user, logPrefix);
    const messageIdsToSync = changeSet.messageIds;
    console.log(
      `${logPrefix} Gmail change detection - ${Date.now() - listStart}ms (${messageIdsToSync.length} messages)`
    );

    if (messageIdsToSync.length === 0) {
      const cachedEmails = await Email.find({ userId: user._id })
        .sort({ date: -1 })
        .limit(20)
        .lean();

      if (changeSet.currentHistoryId) {
        await User.updateOne(
          { _id: user._id },
          { $set: { gmailHistoryId: changeSet.currentHistoryId } }
        );
      }

      return {
        syncedCount: 0,
        newEmails: [],
        emails: cachedEmails,
      };
    }

    // 2. Fetch metadata with controlled concurrency (5 workers)
    const metaStart = Date.now();
    const messageResponses = await mapConcurrent(messageIdsToSync, 5, async (messageId) => {
      try {
        const res = await gmail.users.messages.get({
          userId: "me",
          id: messageId,
          format: "metadata",
          metadataHeaders: ["From", "To", "Subject", "Date"],
        });
        return res.data;
      } catch (getErr) {
        console.warn(`${logPrefix} Failed to fetch message ${messageId}:`, getErr.message);
        return null;
      }
    });
    console.log(
      `${logPrefix} Gmail metadata - ${Date.now() - metaStart}ms (${messageResponses.filter(Boolean).length} fetched)`
    );
    const metadataComplete = messageResponses.every(Boolean);

    // 3. Extract and parse email attributes
    const parsedEmails = [];
    const messageIds = [];
    for (const data of messageResponses) {
      if (!data) continue;

      const headers = data.payload?.headers || [];
      const sender = getHeader(headers, "From");
      const recipient = getHeader(headers, "To");
      const subject = getHeader(headers, "Subject") || "(No subject)";
      const dateHeader = getHeader(headers, "Date");
      const body = data.snippet || "";
      const preview = data.snippet || "";
      const parsedMetadata = parseGmailMessage(data);

      messageIds.push(data.id);
      parsedEmails.push({
        data,
        sender,
        recipient,
        subject,
        dateHeader,
        body,
        preview,
        attachments: parsedMetadata.attachments || [],
      });
    }

    // 4. Query MongoDB for existing emails to avoid re-classifying known emails
    const existingInDb = await Email.find({
      userId: user._id,
      gmailMessageId: { $in: messageIds },
    }).lean();

    const existingMap = new Map();
    for (const email of existingInDb) {
      existingMap.set(email.gmailMessageId, email);
    }

    // Partition parsed emails into NEW (need ML) vs EXISTING (only update mutable fields)
    const newEmailsToClassify = [];
    const existingEmailsToUpdate = [];

    for (const item of parsedEmails) {
      const existing = existingMap.get(item.data.id);
      const isInboxMessage = (item.data.labelIds || []).includes("INBOX");
      if (!existing && !isInboxMessage) continue;
      if (existing && ["HIGH", "MEDIUM", "LOW"].includes(existing.priority)) {
        existingEmailsToUpdate.push({
          item,
          existing,
        });
      } else {
        newEmailsToClassify.push(item);
      }
    }

    // 5. Batch ML classification ONLY for NEW emails
    const mlStart = Date.now();
    let newPredictions = [];
    if (newEmailsToClassify.length > 0) {
      const mlPayload = newEmailsToClassify.map((item) => ({
        sender: item.sender,
        subject: item.subject,
        body: item.body,
      }));

      try {
        newPredictions = await classifyEmailsBatch(mlPayload);
        console.log(
          `${logPrefix} ML classification for ${newEmailsToClassify.length} new emails - ${Date.now() - mlStart}ms`
        );
      } catch (mlErr) {
        console.warn(`${logPrefix} ML service unavailable, using default fallback:`, mlErr.message);
        newPredictions = newEmailsToClassify.map(() => ({
          priority: "MEDIUM",
          confidence: null,
          aiReasons: ["AI classification unavailable"],
        }));
      }
    } else {
      console.log(
        `${logPrefix} 0 new emails to classify. Skipping ML inference.`
      );
    }

    const customKeywords = newEmailsToClassify.length > 0
      ? await getActiveKeywords(user._id)
      : [];
    if (newEmailsToClassify.length > 0) {
      console.log(`${logPrefix} Loaded ${customKeywords.length} active custom keywords`);
    }

    // 6. Build MongoDB bulk operations
    const bulkOperations = [];
    const newlyDetectedEmails = [];
    let classifiedCount = 0;
    let classificationFailedCount = 0;
    let updatedEmails = 0;
    let unchangedEmails = 0;

    // Process newly classified emails
    for (let i = 0; i < newEmailsToClassify.length; i++) {
      const item = newEmailsToClassify[i];
      const prediction = newPredictions[i] || {
        priority: "MEDIUM",
        confidence: null,
        aiReasons: ["AI classification unavailable"],
      };
      const confidence =
        typeof prediction.confidence === "number" ? prediction.confidence : null;
      const aiReasons = Array.isArray(prediction.aiReasons)
        ? prediction.aiReasons
        : ["AI classification unavailable"];
      const matches = matchCustomKeywords(customKeywords, item.subject, item.body);
      const decision = applyPriorityDecision(
        { ...prediction, aiReasons },
        matches
      );
      const { priority, important } = decision;
      const classificationFailed =
        confidence === null ||
        aiReasons.some((reason) => /unavailable/i.test(reason));
      if (classificationFailed) classificationFailedCount += 1;
      else classifiedCount += 1;

      const emailDoc = {
        userId: user._id,
        gmailMessageId: item.data.id,
        threadId: item.data.threadId || null,

        sender: item.sender,
        recipient: item.recipient,
        subject: item.subject,

        body: item.body,
        preview: item.preview,

        date: item.dateHeader ? new Date(item.dateHeader) : null,
        unread: (item.data.labelIds || []).includes("UNREAD"),

        priority,
        confidence: decision.confidence,
        mlPriority: decision.mlPriority,
        mlConfidence: decision.mlConfidence,
        aiReasons: decision.aiReasons,
        matchedKeywords: decision.matchedKeywords,
        important,

        gmailLabels: item.data.labelIds || [],
        attachments: item.attachments,
        lastSyncedAt: new Date(),
      };

      if (!existingMap.has(item.data.id)) {
        console.log(`${logPrefix} New email detected: ${item.data.id} - "${item.subject}"`);
        newlyDetectedEmails.push({
          id: item.data.id,
          gmailMessageId: item.data.id,
          subject: item.subject,
          sender: item.sender,
          preview: item.preview,
          priority,
          confidence: decision.confidence,
          aiReasons: decision.aiReasons,
          matchedKeywords: decision.matchedKeywords,
          unread: (item.data.labelIds || []).includes("UNREAD"),
          date: item.dateHeader ? new Date(item.dateHeader) : null,
        });
      }

      bulkOperations.push({
        updateOne: {
          filter: {
            userId: user._id,
            gmailMessageId: item.data.id,
          },
          update: {
            $set: emailDoc,
          },
          upsert: true,
        },
      });
    }

    // Process existing emails: update mutable fields (unread, labels, lastSyncedAt) without re-running ML
    for (const { item, existing } of existingEmailsToUpdate) {
      const currentLabels = item.data.labelIds || [];
      const gmailUnread = currentLabels.includes("UNREAD");
      const isUnread = gmailUnread && !existing.localReadAt;
      const localReadAt = gmailUnread ? existing.localReadAt : null;

      console.log(
        `[ReadState] Gmail labels: ${item.data.id} ${JSON.stringify(currentLabels)}`
      );
      console.log(`[ReadState] Calculated unread: ${item.data.id} ${isUnread}`);

      const nextDate = item.dateHeader ? new Date(item.dateHeader) : null;
      const changed =
        existing.threadId !== (item.data.threadId || null) ||
        existing.sender !== item.sender ||
        existing.recipient !== item.recipient ||
        existing.subject !== item.subject ||
        existing.preview !== item.preview ||
        (existing.date?.getTime?.() || existing.date) !== (nextDate?.getTime?.() || nextDate) ||
        existing.unread !== isUnread ||
        JSON.stringify(existing.gmailLabels || []) !== JSON.stringify(currentLabels) ||
        JSON.stringify(existing.attachments || []) !== JSON.stringify(item.attachments || []) ||
        Boolean(existing.localReadAt) !== Boolean(localReadAt);

      if (!changed) {
        unchangedEmails += 1;
        continue;
      }
      updatedEmails += 1;

      bulkOperations.push({
        updateOne: {
          filter: {
            userId: user._id,
            gmailMessageId: item.data.id,
          },
          update: {
            $set: {
              threadId: item.data.threadId || null,
              sender: item.sender,
              recipient: item.recipient,
              subject: item.subject,
              preview: item.preview,
              date: nextDate,
              unread: isUnread,
              gmailLabels: currentLabels,
              attachments: item.attachments || [],
              localReadAt,
              lastSyncedAt: new Date(),
            },
          },
        },
      });
    }

    // 7. Execute MongoDB bulkWrite
    const dbStart = Date.now();
    if (bulkOperations.length > 0) {
      await Email.bulkWrite(bulkOperations, { ordered: false });
    }

    if (changeSet.currentHistoryId && metadataComplete) {
      await User.updateOne(
        { _id: user._id },
        { $set: { gmailHistoryId: changeSet.currentHistoryId } }
      );
    }
    console.log(
      `${logPrefix} MongoDB bulk write - ${Date.now() - dbStart}ms (${bulkOperations.length} operations, ${newlyDetectedEmails.length} new)`
    );

    // 8. Fetch latest 20 emails from MongoDB once
    const cachedEmails = await Email.find({ userId: user._id })
      .sort({ date: -1 })
      .limit(20)
      .lean();

    // 9. Update Redis cache once
    if (bulkOperations.length > 0) {
      const redisStart = Date.now();
      try {
        await setCachedEmails(userIdStr, cachedEmails);
        console.log(`${logPrefix} Redis updated in ${Date.now() - redisStart}ms`);
      } catch (redisError) {
        console.warn(`${logPrefix} Redis cache update warning:`, redisError.message);
      }
    }

    console.log(`${logPrefix} Completed in ${Date.now() - syncStart}ms`);

    return {
      syncedCount: parsedEmails.length,
      fetched: parsedEmails.length,
      newEmails: newlyDetectedEmails,
      newEmailsCount: newlyDetectedEmails.length,
      updatedEmails,
      unchangedEmails,
      classified: classifiedCount,
      classificationFailed: classificationFailedCount,
      emails: cachedEmails,
    };
  } catch (syncErr) {
    if (
      syncErr.message?.includes("invalid_grant") ||
      syncErr.response?.data?.error === "invalid_grant"
    ) {
      console.warn(
        `${logPrefix} Gmail OAuth token expired or revoked for user ${userIdStr} (invalid_grant). Marking gmailConnected = false.`
      );
      await User.findByIdAndUpdate(user._id, { gmailConnected: false }).catch(() => {});
    }
    throw syncErr;
  } finally {
    await releaseSyncLock(userIdStr);
  }
};

module.exports = {
  syncUserEmails,
  isUserSyncing,
};
