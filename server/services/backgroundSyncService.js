const User = require("../models/User");
const { syncUserEmails, isUserSyncing } = require("./emailSyncService");
const { emitNewEmailToUser } = require("../config/socket");

// Safe interval: 2 minutes default (120,000 ms)
const DEFAULT_INTERVAL_MS = 2 * 60 * 1000;
const SYNC_INTERVAL_MS =
  parseInt(process.env.BACKGROUND_SYNC_INTERVAL_MS, 10) || DEFAULT_INTERVAL_MS;

let timerId = null;
let initialTimerId = null;
let isSchedulerRunning = false;
let isJobExecuting = false;

// Listeners for real-time notification hooks (e.g. Socket.io in next phase)
// Listeners for real-time notification hooks
const newEmailListeners = new Set();

/**
 * Registers a callback listener to be invoked whenever a new email is detected.
 * Future Socket.io integration can register here to emit "new-email" events.
 *
 * @param {Function} listener (userId: string, email: Object) => void
 * @returns {Function} unregister function
 */
const registerNewEmailListener = (listener) => {
  if (typeof listener === "function") {
    newEmailListeners.add(listener);
  }
  return () => {
    newEmailListeners.delete(listener);
  };
};

/**
 * Notifies all registered listeners of a newly detected email.
 * Emits real-time Socket.io event and notifies registered listeners of a newly detected email.
 *
 * @param {string} userId
 * @param {Object} newEmail
 */
const notifyNewEmail = (userId, newEmail) => {
  // 1. Emit real-time Socket.io event to the user's private room
  try {
    emitNewEmailToUser(userId, newEmail);
  } catch (socketErr) {
    console.error("[BackgroundSync] Failed to emit socket event:", socketErr.message);
  }

  // 2. Notify custom registered listeners
  for (const listener of newEmailListeners) {
    try {
      listener(userId, newEmail);
    } catch (err) {
      console.error("[BackgroundSync] Error executing new email listener:", err.message);
    }
  }
};

/**
 * Runs one background sync cycle across all users with connected Gmail accounts.
 * Users are processed sequentially to avoid database or network congestion.
 */
const runBackgroundSyncOnce = async () => {
  if (isJobExecuting) {
    console.log("[BackgroundSync] Previous sync cycle still executing. Skipping this tick.");
    return;
  }

  isJobExecuting = true;
  const cycleStart = Date.now();

  try {
    console.log("[BackgroundSync] Started");

    // Find all users who have Gmail connected and a valid refresh token
    const connectedUsers = await User.find({
      gmailConnected: true,
      gmailRefreshToken: { $exists: true, $ne: null },
    })
      .select("_id email name gmailAccessToken gmailRefreshToken gmailTokenExpiry gmailHistoryId")
      .lean();

    console.log(
      `[BackgroundSync] Checking ${connectedUsers.length} connected users`
    );

    if (connectedUsers.length === 0) {
      console.log(`[BackgroundSync] Completed in ${Date.now() - cycleStart}ms (0 users)`);
      return;
    }

    // Process users sequentially to prevent network/rate-limit spikes
    for (const user of connectedUsers) {
      const userIdStr = user._id.toString();

      // Check per-user lock (e.g. if manual sync is currently running for this user)
      if (isUserSyncing(userIdStr)) {
        console.log(
          `[BackgroundSync] User ${userIdStr} is already syncing. Skipping.`
        );
        continue;
      }

      const userSyncStart = Date.now();
      console.log(`[BackgroundSync] Syncing user ${userIdStr}`);

      try {
        const result = await syncUserEmails(user, { isBackground: true });

        const newCount = result.newEmails?.length || 0;
        console.log(
          `[BackgroundSync] User ${userIdStr} synced ${result.syncedCount} emails (${newCount} new)`
        );

        // Notify listeners if new emails were detected
        if (Array.isArray(result.newEmails) && result.newEmails.length > 0) {
          for (const newEmail of result.newEmails) {
            notifyNewEmail(userIdStr, newEmail);
          }
        }

        console.log(
          `[BackgroundSync] User sync completed in ${Date.now() - userSyncStart}ms`
        );
      } catch (userError) {
        // Individual user failure should NEVER break the entire background job for others
        console.error(
          `[BackgroundSync] Error syncing user ${userIdStr}:`,
          userError.message
        );
        if (
          userError.message?.includes("invalid_grant") ||
          userError.response?.data?.error === "invalid_grant" ||
          userError.message?.includes("No access, refresh token")
        ) {
          console.warn(
            `[BackgroundSync] Token expired or revoked for user ${userIdStr}. Marking gmailConnected = false.`
          );
          await User.findByIdAndUpdate(user._id, { gmailConnected: false }).catch(() => {});
        }
      }
    }

    console.log(
      `[BackgroundSync] Completed in ${Date.now() - cycleStart}ms`
    );
  } catch (error) {
    console.error("[BackgroundSync] Cycle encountered an unexpected error:", error.message);
  } finally {
    isJobExecuting = false;
  }
};

/**
 * Starts the automatic background sync scheduler.
 * Safe against multiple invocations (singleton guard).
 */
const startBackgroundSync = () => {
  if (isSchedulerRunning) {
    console.log("[BackgroundSync] Scheduler is already running.");
    return;
  }

  isSchedulerRunning = true;
  console.log(
    `[BackgroundSync] Initialized. Running every ${SYNC_INTERVAL_MS / 1000}s.`
  );

  // Initial delayed run after startup (10 seconds) so server fully stabilizes
  initialTimerId = setTimeout(() => {
    initialTimerId = null;
    runBackgroundSyncOnce().catch((err) => {
      console.error("[BackgroundSync] Initial run error:", err.message);
    });
  }, 10000);

  // Recurring interval
  timerId = setInterval(() => {
    runBackgroundSyncOnce().catch((err) => {
      console.error("[BackgroundSync] Periodic run error:", err.message);
    });
  }, SYNC_INTERVAL_MS);

  // Ensure timer does not prevent process exit in test runners
  if (timerId && typeof timerId.unref === "function") {
    timerId.unref();
  }
};

/**
 * Stops the automatic background sync scheduler (for clean shutdown/testing).
 */
const stopBackgroundSync = () => {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
  if (initialTimerId) {
    clearTimeout(initialTimerId);
    initialTimerId = null;
  }
  isSchedulerRunning = false;
  isJobExecuting = false;
  console.log("[BackgroundSync] Scheduler stopped.");
};

module.exports = {
  startBackgroundSync,
  stopBackgroundSync,
  runBackgroundSyncOnce,
  registerNewEmailListener,
};
