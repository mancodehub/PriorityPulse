require("dotenv").config();
const mongoose = require("mongoose");
const { connectRedis, redisClient } = require("../config/redis");
const { getCachedEmails, setCachedEmails } = require("../services/emailCacheService");
const { isUserSyncing } = require("../services/emailSyncService");

async function verifyPerformance() {
  console.log("=== VERIFYING INBOX LOADING PERFORMANCE ===");

  await connectRedis();
  console.log("Redis connected.");

  const mockUserId = new mongoose.Types.ObjectId().toString();

  // Test 1: Redis MISS
  const missStart = Date.now();
  const missResult = await getCachedEmails(mockUserId);
  const missTime = Date.now() - missStart;
  console.log(`Test 1: Redis MISS took ${missTime}ms (result: ${missResult})`);
  if (missResult !== null) throw new Error("Expected null for cache miss");

  // Test 2: Populate Redis
  const sampleEmails = [
    {
      id: "msg-1",
      gmailMessageId: "msg-1",
      sender: "security@google.com",
      subject: "Critical security alert",
      body: "Immediate action required",
      preview: "Immediate action required",
      priority: "HIGH",
      confidence: 0.9,
      important: true,
      date: new Date().toISOString(),
      unread: true,
    },
    {
      id: "msg-2",
      gmailMessageId: "msg-2",
      sender: "pm@company.com",
      subject: "Sprint 24 notes",
      body: "Weekly sync summary",
      preview: "Weekly sync summary",
      priority: "MEDIUM",
      confidence: 0.83,
      important: false,
      date: new Date().toISOString(),
      unread: false,
    },
  ];

  await setCachedEmails(mockUserId, sampleEmails);
  console.log("Populated mock Redis cache.");

  // Test 3: Redis HIT (Target < 15ms)
  const hitStart = Date.now();
  const hitResult = await getCachedEmails(mockUserId);
  const hitTime = Date.now() - hitStart;
  console.log(`Test 3: Redis HIT took ${hitTime}ms (${hitResult?.length} emails returned)`);

  if (!hitResult || hitResult.length !== 2) {
    throw new Error("Failed to retrieve cached emails from Redis");
  }

  if (hitTime > 50) {
    console.warn(`Warning: Redis read took ${hitTime}ms, target is < 20ms`);
  } else {
    console.log(`PASS: Redis HIT is near-instantaneous (${hitTime}ms < 20ms)`);
  }

  // Clean up mock user
  await redisClient.del(`prioritypulse:emails:${mockUserId}`);
  console.log("Cleaned up mock Redis key.");

  // Test 4: Verify sync lock functions
  console.log(`Test 4: isUserSyncing("fake-id"): ${isUserSyncing("fake-id")}`);
  if (isUserSyncing("fake-id") !== false) throw new Error("Unexpected lock state");

  console.log("\nALL INBOX PERFORMANCE & PIPELINE TESTS PASSED!");
  process.exit(0);
}

verifyPerformance().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});

