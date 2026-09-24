const { google } = require("googleapis");
const mongoose = require("mongoose");
const User = require("../models/User");
const Email = require("../models/Email");

const {
  getCachedEmails,
  setCachedEmails,
  updateCachedEmailReadState,
  getCachedEmailBody,
  setCachedEmailBody,
} = require("../services/emailCacheService");

const {
  syncUserEmails,
  isUserSyncing,
} = require("../services/emailSyncService");

const {
  emitEmailUpdatedToUser,
  emitNewEmailToUser,
} = require("../config/socket");
const { parseGmailMessage } = require("../utils/gmailMessageParser");
const { matchCustomKeywords, getActiveKeywords } = require("../services/customKeywordService");

// --------------------------------------------------
// Gmail Client
// --------------------------------------------------

const getGmailClient = async (user) => {
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

const getHeader = (headers = [], name) =>
  headers.find((header) => header.name?.toLowerCase() === name.toLowerCase())?.value || "";

// --------------------------------------------------
// Get Emails (High Performance: Redis -> MongoDB -> Gmail)
// Supports advanced search, filtering, sorting, and pagination
// --------------------------------------------------

const escapeRegex = (str = "") =>
  str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getEmails = async (req, res, next) => {
  const getStart = Date.now();

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.gmailConnected || !user.gmailRefreshToken) {
      return res.status(400).json({
        success: false,
        message: "Gmail account is not connected",
      });
    }

    const userId = user._id.toString();

    // --------------------------------------------------
    // Parse & Validate Query Parameters
    // --------------------------------------------------
    const hasSearch =
      typeof req.query.search === "string" && req.query.search.trim().length > 0;
    const rawPriority =
      typeof req.query.priority === "string"
        ? req.query.priority.toUpperCase().trim()
        : "";
    const hasPriority = ["HIGH", "MEDIUM", "LOW"].includes(rawPriority);
    const hasUnread =
      req.query.unread === "true" || req.query.unread === "false";
    if (typeof req.query.unread !== "undefined") {
      console.log(`[ReadState] Filter unread parameter: ${req.query.unread}`);
    }
    const hasFrom = Boolean(
      req.query.from && !isNaN(new Date(req.query.from).getTime())
    );
    const hasTo = Boolean(
      req.query.to && !isNaN(new Date(req.query.to).getTime())
    );
    const isOldestSort = req.query.sort === "oldest";
    const hasPage = typeof req.query.page !== "undefined";
    const hasLimit = typeof req.query.limit !== "undefined";
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));

    const isFiltered =
      hasSearch ||
      hasPriority ||
      hasUnread ||
      hasFrom ||
      hasTo ||
      isOldestSort ||
      hasPage ||
      hasLimit;

    // --------------------------------------------------
    // PATH 1: DEFAULT INBOX (FAST REDIS PATH - < 10ms)
    // When no search, filters, or pagination are specified, use Redis
    // --------------------------------------------------
    if (!isFiltered) {
      console.log("[Inbox] Default inbox requested");

      // 1. Check Redis Cache First
      try {
        const cachedEmails = await getCachedEmails(userId);

        if (Array.isArray(cachedEmails) && cachedEmails.length > 0) {
          console.log(
            `[Inbox] Redis HIT - ${Date.now() - getStart}ms (${cachedEmails.length} emails)`
          );

          let totalCount = cachedEmails.length;
          try {
            totalCount = await Email.countDocuments({ userId: user._id });
          } catch (countErr) {
            // fallback to cached count
          }
          const totalPages = Math.max(1, Math.ceil(totalCount / 20));
          const hasNextPage = totalPages > 1;

          // Return immediately with standard pagination envelope
          res.status(200).json({
            success: true,
            source: "cache",
            count: cachedEmails.length,
            emails: cachedEmails,
            pagination: {
              page: 1,
              limit: 20,
              total: totalCount,
              totalPages,
              hasNextPage,
            },
          });

          // Stale-While-Revalidate background sync
          if (!isUserSyncing(userId)) {
            syncUserEmails(user).catch((bgError) => {
              console.warn(
                "[Inbox] Background email sync warning:",
                bgError.message
              );
            });
          }

          return;
        }

        console.log(`[Inbox] Redis MISS - ${Date.now() - getStart}ms`);
      } catch (redisError) {
        console.warn("[Inbox] Redis cache read warning:", redisError.message);
      }

      // 2. Check MongoDB Database Second (Persistent Cache)
      const dbEmails = await Email.find({ userId: user._id })
        .sort({ date: -1 })
        .limit(20)
        .lean();

      if (Array.isArray(dbEmails) && dbEmails.length > 0) {
        console.log(
          `[Inbox] MongoDB HIT - ${Date.now() - getStart}ms (${dbEmails.length} emails)`
        );

        setCachedEmails(userId, dbEmails).catch((redisWriteErr) => {
          console.warn(
            "[Inbox] Background Redis cache write warning:",
            redisWriteErr.message
          );
        });

        res.status(200).json({
          success: true,
          source: "database",
          count: dbEmails.length,
          emails: dbEmails,
          pagination: {
            page: 1,
            limit: 20,
            total: dbEmails.length,
            totalPages: 1,
            hasNextPage: false,
          },
        });

        if (!isUserSyncing(userId)) {
          syncUserEmails(user).catch((bgError) => {
            console.warn(
              "[Inbox] Background email sync warning:",
              bgError.message
            );
          });
        }

        return;
      }

      // 3. Both Empty -> Initial Gmail Sync
      console.log(
        "[Inbox] Redis MISS and MongoDB MISS - performing initial Gmail sync"
      );
      const syncStart = Date.now();
      const syncResult = await syncUserEmails(user);

      console.log(`[Inbox] Gmail fetch - ${Date.now() - syncStart}ms`);
      return res.status(200).json({
        success: true,
        source: "gmail",
        count: syncResult.emails.length,
        emails: syncResult.emails,
        pagination: {
          page: 1,
          limit: 20,
          total: syncResult.emails.length,
          totalPages: 1,
          hasNextPage: false,
        },
      });
    }

    // --------------------------------------------------
    // PATH 2: FILTERED / SEARCH / PAGINATED QUERY (MONGODB)
    // Execute dynamic indexed query against full collection
    // --------------------------------------------------
    console.log(
      `[Inbox] Filtered query: search="${req.query.search || ""}", priority="${rawPriority}", unread="${req.query.unread || ""}", page=${page}, limit=${limit}`
    );

    // Build dynamic query safely scoped to authenticated user
    const query = { userId: user._id };

    if (hasPriority) {
      query.priority = rawPriority;
    }

    if (hasUnread) {
      query.unread = req.query.unread === "true";
    }

    if (hasFrom || hasTo) {
      query.date = {};
      if (hasFrom) {
        const fromDate = new Date(req.query.from);
        fromDate.setUTCHours(0, 0, 0, 0);
        query.date.$gte = fromDate;
      }
      if (hasTo) {
        const toDate = new Date(req.query.to);
        toDate.setUTCHours(23, 59, 59, 999);
        query.date.$lte = toDate;
      }
    }

    if (hasSearch) {
      const searchRegex = new RegExp(
        escapeRegex(req.query.search.trim()),
        "i"
      );
      query.$or = [
        { subject: searchRegex },
        { sender: searchRegex },
        { recipient: searchRegex },
        { preview: searchRegex },
        { body: searchRegex },
      ];
    }

    const sortOrder = isOldestSort ? { date: 1 } : { date: -1 };
    const skip = (page - 1) * limit;

    const [filteredEmails, totalCount] = await Promise.all([
      Email.find(query)
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .lean(),
      Email.countDocuments(query),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    const hasNextPage = page < totalPages;

    console.log(
      `[Inbox] Filter query completed in ${Date.now() - getStart}ms. Returned ${filteredEmails.length}/${totalCount} emails.`
    );

    return res.status(200).json({
      success: true,
      source: "mongodb",
      count: filteredEmails.length,
      emails: filteredEmails,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNextPage,
      },
    });
  } catch (error) {
    console.error("[Inbox] Get emails error:", error);
    next(error);
  }
};

// --------------------------------------------------
// Custom keyword inbox (MongoDB source of truth)
// --------------------------------------------------

const getCustomKeywordEmails = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const keywords = await getActiveKeywords(userId);
    const requestedKeyword = typeof req.query.keyword === "string"
      ? req.query.keyword.trim().toLowerCase()
      : "";
    const rawPriority = typeof req.query.priority === "string"
      ? req.query.priority.trim().toUpperCase()
      : "";
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const query = { userId, "matchedKeywords.0": { $exists: true } };

    if (requestedKeyword) query["matchedKeywords.keyword"] = requestedKeyword;
    if (["HIGH", "MEDIUM", "LOW"].includes(rawPriority)) query.priority = rawPriority;
    if (req.query.unread === "true" || req.query.unread === "false") query.unread = req.query.unread === "true";
    if (typeof req.query.search === "string" && req.query.search.trim()) {
      const search = escapeRegex(req.query.search.trim());
      query.$or = [
        { sender: new RegExp(search, "i") },
        { subject: new RegExp(search, "i") },
        { preview: new RegExp(search, "i") },
        { body: new RegExp(search, "i") },
      ];
    }

    const [emails, total] = await Promise.all([
      Email.find(query).sort({ date: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Email.countDocuments(query),
    ]);

    // Return only currently active matches, protecting against stale cache/index data.
    const filtered = emails.filter((email) => {
      const current = matchCustomKeywords(keywords, email.subject, email.bodyText || email.body || email.preview);
      const currentMatches = ["HIGH", "MEDIUM", "LOW"].flatMap((priority) => current[priority]);
      return currentMatches.length > 0 && (!requestedKeyword || currentMatches.includes(requestedKeyword));
    });

    return res.status(200).json({
      success: true,
      emails: filtered,
      keywords: keywords.map((item) => item.keyword),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)), hasNextPage: page * limit < total },
    });
  } catch (error) {
    next(error);
  }
};

// --------------------------------------------------
// Real Dashboard Analytics (MongoDB source of truth)
// --------------------------------------------------

const getEmailAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const todayStart = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    ));
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);
    const weekStart = new Date(todayStart);
    weekStart.setUTCDate(weekStart.getUTCDate() - 6);

    const [result] = await Email.aggregate([
      { $match: { userId } },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                totalEmails: { $sum: 1 },
                unreadEmails: {
                  $sum: { $cond: [{ $eq: ["$unread", true] }, 1, 0] },
                },
                readEmails: {
                  $sum: { $cond: [{ $eq: ["$unread", false] }, 1, 0] },
                },
                highPriority: {
                  $sum: { $cond: [{ $eq: ["$priority", "HIGH"] }, 1, 0] },
                },
                mediumPriority: {
                  $sum: { $cond: [{ $eq: ["$priority", "MEDIUM"] }, 1, 0] },
                },
                lowPriority: {
                  $sum: { $cond: [{ $eq: ["$priority", "LOW"] }, 1, 0] },
                },
                todayEmails: {
                  $sum: {
                    $cond: [
                      { $and: [{ $gte: ["$date", todayStart] }, { $lt: ["$date", tomorrowStart] }] },
                      1,
                      0,
                    ],
                  },
                },
                weekEmails: {
                  $sum: {
                    $cond: [
                      { $and: [{ $gte: ["$date", weekStart] }, { $lt: ["$date", tomorrowStart] }] },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ],
          dailyTrend: [
            { $match: { date: { $gte: weekStart, $lt: tomorrowStart } } },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$date",
                    timezone: "UTC",
                  },
                },
                total: { $sum: 1 },
                high: { $sum: { $cond: [{ $eq: ["$priority", "HIGH"] }, 1, 0] } },
                medium: { $sum: { $cond: [{ $eq: ["$priority", "MEDIUM"] }, 1, 0] } },
                low: { $sum: { $cond: [{ $eq: ["$priority", "LOW"] }, 1, 0] } },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]);

    const summary = result?.summary?.[0] || {};
    const trendByDate = new Map(
      (result?.dailyTrend || []).map((day) => [day._id, {
        date: day._id,
        total: day.total || 0,
        high: day.high || 0,
        medium: day.medium || 0,
        low: day.low || 0,
      }])
    );
    const dailyTrend = [];
    for (let index = 0; index < 7; index += 1) {
      const day = new Date(weekStart);
      day.setUTCDate(day.getUTCDate() + index);
      const date = day.toISOString().slice(0, 10);
      dailyTrend.push(
        trendByDate.get(date) || { date, total: 0, high: 0, medium: 0, low: 0 }
      );
    }

    return res.status(200).json({
      success: true,
      analytics: {
        totalEmails: summary.totalEmails || 0,
        unreadEmails: summary.unreadEmails || 0,
        readEmails: summary.readEmails || 0,
        highPriority: summary.highPriority || 0,
        mediumPriority: summary.mediumPriority || 0,
        lowPriority: summary.lowPriority || 0,
        todayEmails: summary.todayEmails || 0,
        weekEmails: summary.weekEmails || 0,
        priorityDistribution: {
          HIGH: summary.highPriority || 0,
          MEDIUM: summary.mediumPriority || 0,
          LOW: summary.lowPriority || 0,
        },
        dailyTrend,
      },
    });
  } catch (error) {
    console.error("[Analytics] Failed to calculate email analytics:", error);
    next(error);
  }
};

// --------------------------------------------------
// Explainable AI Insights (stored ML results only)
// --------------------------------------------------

const getAIInsights = async (req, res, next) => {
  try {
    const validPriorities = ["HIGH", "MEDIUM", "LOW"];
    const [result] = await Email.aggregate([
      { $match: { userId: req.user._id } },
      {
        $facet: {
          classification: [
            {
              $group: {
                _id: null,
                classifiedEmails: {
                  $sum: { $cond: [{ $in: ["$priority", validPriorities] }, 1, 0] },
                },
                unclassifiedEmails: {
                  $sum: { $cond: [{ $in: ["$priority", validPriorities] }, 0, 1] },
                },
              },
            },
          ],
          confidence: [
            {
              $match: {
                priority: { $in: validPriorities },
                confidence: { $type: "number" },
              },
            },
            {
              $group: {
                _id: null,
                averageConfidence: { $avg: "$confidence" },
                highConfidence: {
                  $sum: { $cond: [{ $gte: ["$confidence", 0.8] }, 1, 0] },
                },
                mediumConfidence: {
                  $sum: {
                    $cond: [
                      { $and: [{ $gte: ["$confidence", 0.6] }, { $lt: ["$confidence", 0.8] }] },
                      1,
                      0,
                    ],
                  },
                },
                lowConfidence: {
                  $sum: { $cond: [{ $lt: ["$confidence", 0.6] }, 1, 0] },
                },
              },
            },
          ],
          priorityConfidence: [
            {
              $match: {
                priority: { $in: validPriorities },
                confidence: { $type: "number" },
              },
            },
            {
              $group: {
                _id: "$priority",
                average: { $avg: "$confidence" },
              },
            },
          ],
          reasons: [
            { $match: { priority: "HIGH", aiReasons: { $type: "array" } } },
            { $unwind: "$aiReasons" },
            { $match: { aiReasons: { $type: "string", $ne: "" } } },
            { $group: { _id: "$aiReasons", count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } },
            { $limit: 5 },
            { $project: { _id: 0, reason: "$_id", count: 1 } },
          ],
          recentHighPriorityEmails: [
            { $match: { priority: "HIGH" } },
            { $sort: { date: -1, _id: -1 } },
            { $limit: 5 },
            {
              $project: {
                _id: 0,
                id: { $toString: "$_id" },
                gmailMessageId: 1,
                subject: 1,
                sender: 1,
                confidence: 1,
                aiReasons: { $slice: [{ $ifNull: ["$aiReasons", []] }, 5] },
                date: 1,
              },
            },
          ],
        },
      },
    ]);

    const classification = result?.classification?.[0] || {};
    const confidence = result?.confidence?.[0] || {};
    const priorityConfidence = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    for (const item of result?.priorityConfidence || []) {
      if (validPriorities.includes(item._id)) {
        priorityConfidence[item._id] = item.average || 0;
      }
    }

    return res.status(200).json({
      success: true,
      insights: {
        classifiedEmails: classification.classifiedEmails || 0,
        unclassifiedEmails: classification.unclassifiedEmails || 0,
        averageConfidence: confidence.averageConfidence || 0,
        highConfidence: confidence.highConfidence || 0,
        mediumConfidence: confidence.mediumConfidence || 0,
        lowConfidence: confidence.lowConfidence || 0,
        topHighPriorityReasons: result?.reasons || [],
        priorityConfidence,
        recentHighPriorityEmails: result?.recentHighPriorityEmails || [],
      },
    });
  } catch (error) {
    console.error("[AIInsights] Failed to calculate AI insights:", error);
    next(error);
  }
};

// --------------------------------------------------
// Sync Emails (Manual User Sync: POST /api/emails/sync)
// --------------------------------------------------

const syncEmails = async (req, res, next) => {
  const syncReqStart = Date.now();
  console.log("[Sync] Manual sync requested");

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.gmailConnected || !user.gmailRefreshToken) {
      return res.status(400).json({
        success: false,
        message: "Gmail account is not connected",
      });
    }

    const result = await syncUserEmails(user);

    // Emit Socket.io real-time event for any newly detected emails
    if (Array.isArray(result.newEmails) && result.newEmails.length > 0) {
      for (const newEmail of result.newEmails) {
        emitNewEmailToUser(user._id.toString(), newEmail);
      }
    }

    console.log(
      `[Sync] Manual sync completed in ${Date.now() - syncReqStart}ms. Synced ${result.syncedCount} emails (${result.newEmails?.length || 0} new).`
    );

    return res.status(200).json({
      success: true,
      message: "Emails synced successfully",
      source: "gmail",
      syncedCount: result.syncedCount,
      fetched: result.fetched || result.syncedCount || 0,
      newEmails: result.newEmailsCount || result.newEmails?.length || 0,
      updatedEmails: result.updatedEmails || 0,
      unchangedEmails: result.unchangedEmails || 0,
      classified: result.classified || 0,
      classificationFailed: result.classificationFailed || 0,
      count: result.emails.length,
      emails: result.emails,
      syncedAt: new Date(),
    });
  } catch (error) {
    console.error("[Sync] Email sync error:", error.message);
    if (
      error.message?.includes("invalid_grant") ||
      error.response?.data?.error === "invalid_grant" ||
      error.message?.includes("No access, refresh token")
    ) {
      await User.findByIdAndUpdate(req.user._id, { gmailConnected: false }).catch(() => {});
      return res.status(400).json({
        success: false,
        message: "Gmail session has expired or been revoked. Please reconnect your Gmail account in Settings.",
      });
    }
    next(error);
  }
};

const formatThreadEmail = (email, parsed = null) => {
  const parsedAttachments = parsed?.attachments || [];
  const attachments = parsedAttachments.length > 0 ? parsedAttachments : (email.attachments || []);
  const labels = Array.isArray(parsed?.gmailLabels) && parsed.gmailLabels.length > 0
    ? parsed.gmailLabels
    : (email.gmailLabels || []);

  return {
    id: email._id.toString(),
    gmailMessageId: email.gmailMessageId,
    threadId: email.threadId,
    sender: parsed?.sender || email.sender,
    recipient: parsed?.recipient || email.recipient,
    subject: parsed?.subject || email.subject,
    body: parsed?.htmlBody || parsed?.textBody || email.body || email.preview || "",
    bodyHtml: parsed?.htmlBody || email.bodyHtml || "",
    bodyText: parsed?.textBody || email.bodyText || email.body || email.preview || "",
    preview: email.preview,
    date: email.date || parsed?.date || null,
    unread: labels.length > 0 ? labels.includes("UNREAD") : Boolean(email.unread),
    priority: email.priority,
    confidence: email.confidence,
    mlPriority: email.mlPriority,
    mlConfidence: email.mlConfidence,
    aiReasons: Array.isArray(email.aiReasons) ? email.aiReasons : [],
    matchedKeywords: Array.isArray(email.matchedKeywords) ? email.matchedKeywords : [],
    important: email.important,
    gmailLabels: labels,
    attachments,
  };
};

const getEmailThread = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const { threadId } = req.params;
    const emails = await Email.find({ userId: user._id, threadId })
      .sort({ date: 1, _id: 1 })
      .lean();
    if (emails.length === 0) {
      return res.status(404).json({ success: false, message: "Email thread not found" });
    }

    const parsedByMessageId = new Map();
    if (user.gmailConnected && user.gmailRefreshToken) {
      try {
        const gmail = await getGmailClient(user);
        const response = await gmail.users.threads.get({
          userId: "me",
          id: threadId,
          format: "full",
        });
        for (const message of response.data.messages || []) {
          parsedByMessageId.set(message.id, parseGmailMessage(message));
        }
      } catch (gmailError) {
        console.warn(`[EmailThread] Gmail thread fetch warning: ${gmailError.message}`);
      }
    }

    const messages = emails
      .map((email) => formatThreadEmail(email, parsedByMessageId.get(email.gmailMessageId)))
      .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));

    return res.status(200).json({
      success: true,
      thread: {
        threadId,
        subject: messages[0]?.subject || "(No subject)",
        messages,
      },
    });
  } catch (error) {
    console.error("[EmailThread] Failed to load thread:", error.message);
    next(error);
  }
};

const downloadEmailAttachment = async (req, res, next) => {
  try {
    const { id, attachmentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id) || !attachmentId) {
      return res.status(400).json({ success: false, message: "Invalid email or attachment" });
    }

    const user = await User.findById(req.user._id);
    const email = await Email.findOne({
      userId: req.user._id,
      $or: [
        ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : []),
        { gmailMessageId: id },
      ],
    });
    if (!user || !email) {
      return res.status(404).json({ success: false, message: "Email not found" });
    }

    let attachment = (email.attachments || []).find(
      (item) => item.attachmentId === attachmentId
    );
    const gmail = await getGmailClient(user);

    if (!attachment) {
      const messageResponse = await gmail.users.messages.get({
        userId: "me",
        id: email.gmailMessageId,
        format: "full",
      });
      const parsed = parseGmailMessage(messageResponse.data);
      attachment = parsed.attachments.find((item) => item.attachmentId === attachmentId);
      if (attachment) {
        email.attachments = parsed.attachments;
        await email.save();
      }
    }

    if (!attachment) {
      return res.status(404).json({ success: false, message: "Attachment not found" });
    }

    const response = await gmail.users.messages.attachments.get({
      userId: "me",
      messageId: email.gmailMessageId,
      id: attachmentId,
    });
    if (!response.data?.data) {
      return res.status(502).json({ success: false, message: "Attachment data unavailable" });
    }

    const filename = String(attachment.filename || "attachment")
      .replace(/[\\\r\n"']/g, "_")
      .slice(0, 180);
    const buffer = Buffer.from(response.data.data, "base64url");
    res.setHeader("Content-Type", attachment.mimeType || "application/octet-stream");
    res.setHeader("Content-Length", buffer.length);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`
    );
    return res.send(buffer);
  } catch (error) {
    console.error("[EmailAttachment] Failed to download attachment:", error.message);
    if (error.response?.status === 404) {
      return res.status(404).json({ success: false, message: "Attachment not found" });
    }
    next(error);
  }
};

// --------------------------------------------------
// Get full content for one email (on-demand when opened)
// --------------------------------------------------

const getEmailById = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { id } = req.params;
    const userId = user._id;

    // Security: strictly query within authenticated user's emails
    let email = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      email = await Email.findOne({ _id: id, userId });
    }
    if (!email) {
      email = await Email.findOne({ gmailMessageId: id, userId });
    }

    if (!email) {
      return res.status(404).json({
        success: false,
        message: "Email not found",
      });
    }

    const emailId = email._id.toString();
    const gmailMessageId = email.gmailMessageId;

    // 1. Check Redis body cache first (< 5ms)
    try {
      const cachedBody = await getCachedEmailBody(userId.toString(), gmailMessageId);
      if (cachedBody) {
        return res.status(200).json({
          success: true,
          source: "cache",
          email: cachedBody,
          ...cachedBody,
        });
      }
    } catch (redisErr) {
      console.warn("[EmailDetail] Redis body cache read warning:", redisErr.message);
    }

    // 2. Check MongoDB for already persisted full body
    if (email.hasFullBody && (email.bodyHtml || email.bodyText)) {
      const formattedEmail = {
        id: emailId,
        gmailMessageId: email.gmailMessageId,
        threadId: email.threadId,
        sender: email.sender,
        recipient: email.recipient,
        subject: email.subject,
        date: email.date,
        bodyHtml: email.bodyHtml,
        bodyText: email.bodyText,
        body: email.bodyHtml || email.bodyText || email.body || email.preview || "",
        preview: email.preview,
        unread: email.unread,
        priority: email.priority,
        confidence: email.confidence,
        mlPriority: email.mlPriority,
        mlConfidence: email.mlConfidence,
        aiReasons: Array.isArray(email.aiReasons) ? email.aiReasons : [],
        matchedKeywords: Array.isArray(email.matchedKeywords) ? email.matchedKeywords : [],
        important: email.important,
        gmailLabels: email.gmailLabels || [],
        attachments: email.attachments || [],
      };

      // Populate Redis body cache asynchronously
      setCachedEmailBody(userId.toString(), gmailMessageId, formattedEmail).catch((err) => {
        console.warn("[EmailDetail] Redis body cache write warning:", err.message);
      });

      return res.status(200).json({
        success: true,
        source: "database",
        email: formattedEmail,
        ...formattedEmail,
      });
    }

    // 3. Fallback if Gmail is disconnected: return partial DB email
    if (!user.gmailConnected || !user.gmailRefreshToken) {
      const fallbackEmail = {
        id: emailId,
        gmailMessageId: email.gmailMessageId,
        threadId: email.threadId,
        sender: email.sender,
        recipient: email.recipient,
        subject: email.subject,
        date: email.date,
        bodyHtml: email.bodyHtml || "",
        bodyText: email.bodyText || email.body || email.preview || "",
        body: email.body || email.preview || "",
        preview: email.preview,
        unread: email.unread,
        priority: email.priority,
        confidence: email.confidence,
        mlPriority: email.mlPriority,
        mlConfidence: email.mlConfidence,
        aiReasons: Array.isArray(email.aiReasons) ? email.aiReasons : [],
        matchedKeywords: Array.isArray(email.matchedKeywords) ? email.matchedKeywords : [],
        important: email.important,
        gmailLabels: email.gmailLabels || [],
        attachments: email.attachments || [],
      };

      return res.status(200).json({
        success: true,
        source: "database-partial",
        email: fallbackEmail,
        ...fallbackEmail,
      });
    }

    // 4. Fetch full message from Gmail
    try {
      const gmail = await getGmailClient(user);
      const gmailResponse = await gmail.users.messages.get({
        userId: "me",
        id: email.gmailMessageId,
        format: "full",
      });

      const parsed = parseGmailMessage(gmailResponse.data);

      // Update Email document in MongoDB
      email.bodyHtml = parsed.htmlBody || "";
      email.bodyText = parsed.textBody || "";
      email.hasFullBody = true;
      email.bodyFetchedAt = new Date();
      if (Array.isArray(parsed.attachments) && parsed.attachments.length > 0) {
        email.attachments = parsed.attachments;
      }
      if (parsed.threadId && !email.threadId) {
        email.threadId = parsed.threadId;
      }
      if (Array.isArray(parsed.gmailLabels) && parsed.gmailLabels.length > 0) {
        email.gmailLabels = parsed.gmailLabels;
      }
      await email.save();

      const formattedEmail = {
        id: emailId,
        gmailMessageId: email.gmailMessageId,
        threadId: email.threadId,
        sender: parsed.sender || email.sender,
        recipient: parsed.recipient || email.recipient,
        cc: parsed.cc || "",
        bcc: parsed.bcc || "",
        subject: parsed.subject || email.subject,
        date: email.date || parsed.date,
        bodyHtml: email.bodyHtml,
        bodyText: email.bodyText,
        body: email.bodyHtml || email.bodyText || email.body || email.preview || "",
        preview: email.preview,
        unread: email.unread,
        priority: email.priority,
        confidence: email.confidence,
        mlPriority: email.mlPriority,
        mlConfidence: email.mlConfidence,
        aiReasons: Array.isArray(email.aiReasons) ? email.aiReasons : [],
        matchedKeywords: Array.isArray(email.matchedKeywords) ? email.matchedKeywords : [],
        important: email.important,
        gmailLabels: email.gmailLabels || [],
        attachments: email.attachments || [],
      };

      // Cache in Redis body cache
      setCachedEmailBody(userId.toString(), gmailMessageId, formattedEmail).catch((err) => {
        console.warn("[EmailDetail] Redis body cache write warning:", err.message);
      });

      return res.status(200).json({
        success: true,
        source: "gmail",
        email: formattedEmail,
        ...formattedEmail,
      });
    } catch (gmailError) {
      console.warn(
        `[EmailDetail] Failed to fetch full message from Gmail (${email.gmailMessageId}):`,
        gmailError.message
      );

      if (
        gmailError.message?.includes("invalid_grant") ||
        gmailError.response?.data?.error === "invalid_grant" ||
        gmailError.message?.includes("No access, refresh token")
      ) {
        console.warn(
          `[EmailDetail] Token expired or revoked for user ${userId.toString()} (invalid_grant). Marking gmailConnected = false.`
        );
        await User.findByIdAndUpdate(user._id, { gmailConnected: false }).catch(() => {});
      }

      // Graceful fallback to existing email data in database so user can view email without a 500 error
      const fallbackEmail = {
        id: emailId,
        gmailMessageId: email.gmailMessageId,
        threadId: email.threadId,
        sender: email.sender,
        recipient: email.recipient,
        subject: email.subject,
        date: email.date,
        bodyHtml: email.bodyHtml || "",
        bodyText: email.bodyText || email.body || email.preview || "",
        body: email.body || email.preview || "",
        preview: email.preview,
        unread: email.unread,
        priority: email.priority,
        confidence: email.confidence,
        mlPriority: email.mlPriority,
        mlConfidence: email.mlConfidence,
        aiReasons: Array.isArray(email.aiReasons) ? email.aiReasons : [],
        matchedKeywords: Array.isArray(email.matchedKeywords) ? email.matchedKeywords : [],
        important: email.important,
        gmailLabels: email.gmailLabels || [],
        attachments: email.attachments || [],
      };

      return res.status(200).json({
        success: true,
        source: "database-fallback",
        email: fallbackEmail,
        ...fallbackEmail,
        warning:
          "Unable to load full body from Gmail (session expired or unavailable). Displaying stored snippet.",
      });
    }
  } catch (error) {
    console.error("[EmailDetail] Error getting full email:", error);
    next(error);
  }
};

const markEmailAsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    let email = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      email = await Email.findOne({ _id: id, userId });
    }
    if (!email) {
      email = await Email.findOne({ gmailMessageId: id, userId });
    }

    if (!email) {
      return res.status(404).json({ success: false, message: "Email not found" });
    }

    email.unread = false;
    email.localReadAt = new Date();
    await email.save();
    console.log(`[ReadState] MongoDB unread updated: ${email.gmailMessageId} false`);

    try {
      const cacheUpdated = await updateCachedEmailReadState(
        userId.toString(),
        email.gmailMessageId,
        false
      );
      const cachedBody = await getCachedEmailBody(
        userId.toString(),
        email.gmailMessageId
      );
      if (cachedBody) {
        await setCachedEmailBody(userId.toString(), email.gmailMessageId, {
          ...cachedBody,
          unread: false,
        });
      }
      console.log(
        `[ReadState] Redis cache updated: ${email.gmailMessageId} ${cacheUpdated ? "list" : "body-only/miss"}`
      );
    } catch (cacheError) {
      console.warn(`[ReadState] Redis cache update warning: ${cacheError.message}`);
    }

    emitEmailUpdatedToUser(userId, {
      id: email._id.toString(),
      gmailMessageId: email.gmailMessageId,
      unread: false,
    });

    // Optionally attempt to remove UNREAD label on Gmail asynchronously without blocking response
    User.findById(userId)
      .then(async (user) => {
        if (user?.gmailConnected && user?.gmailRefreshToken) {
          try {
            const gmail = await getGmailClient(user);
            await gmail.users.messages.modify({
              userId: "me",
              id: email.gmailMessageId,
              requestBody: {
                removeLabelIds: ["UNREAD"],
              },
            });
            console.log(`[ReadState] Gmail mark-as-read: ${email.gmailMessageId} succeeded`);
          } catch (modifyErr) {
            console.log(
              "Current Gmail OAuth token does not have modify scope; local read state updated.",
              modifyErr.message
            );
          }
        } else {
          console.log(
            "Current Gmail OAuth token does not have modify scope; local read state updated."
          );
        }
      })
      .catch(() => {});

    return res.status(200).json({
      success: true,
      id: email._id.toString(),
      gmailMessageId: email.gmailMessageId,
      unread: false,
    });
  } catch (error) {
    console.error("[EmailDetail] Mark read error:", error);
    next(error);
  }
};

// Aliases for compatibility
const getEmailContent = getEmailById;
const markEmailRead = markEmailAsRead;

// --------------------------------------------------
// Exports
// --------------------------------------------------

module.exports = {
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
};
