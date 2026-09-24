const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Email = require("../models/Email");
const User = require("../models/User");
const { connectRedis, redisClient } = require("../config/redis");
const { setCachedEmails, getCachedEmails } = require("../services/emailCacheService");
const { getEmails } = require("../controllers/emailController");

// Helper to simulate express req/res
function mockReqRes(reqOptions = {}) {
  let statusCode = 200;
  let responseData = null;

  const req = {
    user: reqOptions.user || { _id: new mongoose.Types.ObjectId() },
    query: reqOptions.query || {},
    params: reqOptions.params || {},
  };

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
  };

  const next = (err) => {
    if (err) throw err;
  };

  return { req, res, getResult: () => ({ status: statusCode, data: responseData }), next };
}

async function runSearchAndFilterTests() {
  console.log("=== RUNNING ADVANCED EMAIL SEARCH & FILTERING TEST SUITE ===\n");

  const connectDB = require("../config/db");
  await connectDB();

  await connectRedis();
  console.log("Connected to Redis.\n");

  // Create isolated test user
  const userA = await User.create({
    email: `test_user_a_${Date.now()}@example.com`,
    name: "User A",
    gmailConnected: true,
    gmailRefreshToken: "mock_refresh_token_a",
  });
  const userAId = userA._id;

  const userB = await User.create({
    email: `test_user_b_${Date.now()}@example.com`,
    name: "User B",
    gmailConnected: true,
    gmailRefreshToken: "mock_refresh_token_b",
  });
  const userBId = userB._id;

  try {
    // -------------------------------------------------------------------------
    // Seed test emails for User A
    // -------------------------------------------------------------------------
    const baseDate = new Date("2026-09-15T12:00:00.000Z");
    const testEmails = [
      {
        userId: userAId,
        gmailMessageId: "search-msg-1",
        sender: "sarah.manager@acme.com",
        recipient: userA.email,
        subject: "Sprint Planning & Team Meeting",
        preview: "Please review the agenda before our quarterly meeting tomorrow.",
        body: "Please review the agenda before our quarterly meeting tomorrow.",
        priority: "HIGH",
        confidence: 0.92,
        unread: true,
        date: new Date("2026-09-10T10:00:00.000Z"),
      },
      {
        userId: userAId,
        gmailMessageId: "search-msg-2",
        sender: "alerts@chasebank.com",
        recipient: userA.email,
        subject: "Security Notification: Unusual Activity",
        preview: "Immediate review requested on recent debit charge.",
        body: "Immediate review requested on recent debit charge.",
        priority: "HIGH",
        confidence: 0.95,
        unread: false,
        date: new Date("2026-09-12T14:30:00.000Z"),
      },
      {
        userId: userAId,
        gmailMessageId: "search-msg-3",
        sender: "dev-team@acme.com",
        recipient: userA.email,
        subject: "Project Roadmap & Release Schedule",
        preview: "Sprint v2.4 deployment timeline and test cases.",
        body: "Sprint v2.4 deployment timeline and test cases.",
        priority: "MEDIUM",
        confidence: 0.78,
        unread: true,
        date: new Date("2026-09-15T09:00:00.000Z"),
      },
      {
        userId: userAId,
        gmailMessageId: "search-msg-4",
        sender: "newsletter@substack.com",
        recipient: userA.email,
        subject: "Weekly Tech Digest",
        preview: "Top 10 software architecture trends this week.",
        body: "Top 10 software architecture trends this week.",
        priority: "LOW",
        confidence: 0.88,
        unread: false,
        date: new Date("2026-09-18T16:00:00.000Z"),
      },
      {
        userId: userAId,
        gmailMessageId: "search-msg-5",
        sender: "hr@acme.com",
        recipient: userA.email,
        subject: "Project Benefits Enrollment Period",
        preview: "Enrollment closes at midnight on September 19.",
        body: "Enrollment closes at midnight on September 19.",
        priority: "HIGH",
        confidence: 0.85,
        unread: true,
        date: new Date("2026-09-19T22:30:00.000Z"), // At end of day Sept 19
      },
    ];

    // Add 20 more emails to test pagination (> 20 total)
    for (let i = 6; i <= 25; i++) {
      testEmails.push({
        userId: userAId,
        gmailMessageId: `search-msg-${i}`,
        sender: `colleague${i}@acme.com`,
        recipient: userA.email,
        subject: `Automated Task Status Report #${i}`,
        preview: `Daily status update for backlog item #${i}`,
        body: `Daily status update for backlog item #${i}`,
        priority: i % 2 === 0 ? "MEDIUM" : "LOW",
        confidence: 0.7,
        unread: i % 3 === 0,
        date: new Date(`2026-09-0${Math.min(9, Math.floor(i / 3) + 1)}T10:00:00.000Z`),
      });
    }

    // Seed User B email (to verify isolation)
    const userBEmail = {
      userId: userBId,
      gmailMessageId: "search-msg-userb",
      sender: "secret@companyb.com",
      recipient: userB.email,
      subject: "Secret Project Meeting",
      preview: "Confidential strategy for company B.",
      body: "Confidential strategy for company B.",
      priority: "HIGH",
      confidence: 0.99,
      unread: true,
      date: new Date(),
    };

    await Email.insertMany([...testEmails, userBEmail]);
    console.log(`Seeded ${testEmails.length} emails for User A and 1 email for User B.\n`);

    // -------------------------------------------------------------------------
    // Test 1: Default Inbox uses Redis Cache (< 10ms)
    // -------------------------------------------------------------------------
    console.log("Test 1: Testing default inbox path with Redis cache...");
    // Warm Redis cache for User A
    const defaultCachedEmails = testEmails.slice(0, 20).map((e, idx) => ({ ...e, id: e.gmailMessageId }));
    await setCachedEmails(userAId.toString(), defaultCachedEmails);

    const { req: req1, res: res1, getResult: getResult1, next: next1 } = mockReqRes({
      user: userA,
      query: {},
    });
    const t1Start = Date.now();
    await getEmails(req1, res1, next1);
    const t1Duration = Date.now() - t1Start;
    const r1 = getResult1();

    if (r1.data.source !== "cache" || r1.data.count !== 20 || t1Duration > 20) {
      throw new Error(`Test 1 Failed: Expected Redis cache hit < 20ms, got source=${r1.data.source} in ${t1Duration}ms`);
    }
    console.log(`PASS: Test 1 - Default Inbox served from Redis in ${t1Duration}ms (source: ${r1.data.source})`);

    // -------------------------------------------------------------------------
    // Test 2: Search by term across fields (subject, sender, body)
    // -------------------------------------------------------------------------
    console.log("\nTest 2: Testing text search for 'meeting'...");
    const { req: req2, res: res2, getResult: getResult2, next: next2 } = mockReqRes({
      user: userA,
      query: { search: "meeting" },
    });
    await getEmails(req2, res2, next2);
    const r2 = getResult2();

    if (r2.data.source !== "mongodb" || r2.data.count !== 1) {
      throw new Error(`Test 2 Failed: Expected 1 matching email for 'meeting', got ${r2.data.count}`);
    }
    if (!r2.data.emails[0].subject.includes("Meeting")) {
      throw new Error(`Test 2 Failed: Unexpected email returned: ${r2.data.emails[0].subject}`);
    }
    console.log(`PASS: Test 2 - Search 'meeting' found: "${r2.data.emails[0].subject}"`);

    // -------------------------------------------------------------------------
    // Test 3: Priority filter (HIGH)
    // -------------------------------------------------------------------------
    console.log("\nTest 3: Testing priority filter ?priority=HIGH...");
    const { req: req3, res: res3, getResult: getResult3, next: next3 } = mockReqRes({
      user: userA,
      query: { priority: "HIGH" },
    });
    await getEmails(req3, res3, next3);
    const r3 = getResult3();

    const allHigh = r3.data.emails.every((e) => e.priority === "HIGH");
    if (!allHigh || r3.data.count !== 3) {
      throw new Error(`Test 3 Failed: Expected 3 HIGH priority emails, got ${r3.data.count}`);
    }
    console.log(`PASS: Test 3 - Filter ?priority=HIGH returned ${r3.data.count} emails, all verified HIGH`);

    // -------------------------------------------------------------------------
    // Test 4: Read/unread filter (?unread=true)
    // -------------------------------------------------------------------------
    console.log("\nTest 4: Testing unread filter ?unread=true...");
    const { req: req4, res: res4, getResult: getResult4, next: next4 } = mockReqRes({
      user: userA,
      query: { unread: "true" },
    });
    await getEmails(req4, res4, next4);
    const r4 = getResult4();

    const allUnread = r4.data.emails.every((e) => e.unread === true);
    if (!allUnread) {
      throw new Error("Test 4 Failed: Expected all returned emails to have unread === true");
    }
    console.log(`PASS: Test 4 - Filter ?unread=true returned ${r4.data.count} unread emails`);

    // -------------------------------------------------------------------------
    // Test 5: Combined search + priority (?search=project&priority=HIGH)
    // -------------------------------------------------------------------------
    console.log("\nTest 5: Testing combined search + priority (?search=project&priority=HIGH)...");
    const { req: req5, res: res5, getResult: getResult5, next: next5 } = mockReqRes({
      user: userA,
      query: { search: "project", priority: "HIGH" },
    });
    await getEmails(req5, res5, next5);
    const r5 = getResult5();

    if (r5.data.count !== 1 || r5.data.emails[0].gmailMessageId !== "search-msg-5") {
      throw new Error(`Test 5 Failed: Expected 1 email (search-msg-5), got count=${r5.data.count}`);
    }
    console.log(`PASS: Test 5 - Combined search & filter found: "${r5.data.emails[0].subject}" (Priority: ${r5.data.emails[0].priority})`);

    // -------------------------------------------------------------------------
    // Test 6: Date range filter with end-of-day boundary
    // -------------------------------------------------------------------------
    console.log("\nTest 6: Testing date range ?from=2026-09-18&to=2026-09-19...");
    const { req: req6, res: res6, getResult: getResult6, next: next6 } = mockReqRes({
      user: userA,
      query: { from: "2026-09-18", to: "2026-09-19" },
    });
    await getEmails(req6, res6, next6);
    const r6 = getResult6();

    // search-msg-4 (Sept 18 16:00) and search-msg-5 (Sept 19 22:30) must be included
    const foundMsg4 = r6.data.emails.some((e) => e.gmailMessageId === "search-msg-4");
    const foundMsg5 = r6.data.emails.some((e) => e.gmailMessageId === "search-msg-5");
    if (!foundMsg4 || !foundMsg5 || r6.data.count !== 2) {
      throw new Error(`Test 6 Failed: Expected 2 emails for Sept 18-19, got count=${r6.data.count}`);
    }
    console.log(`PASS: Test 6 - Date range successfully includes end-of-day emails up to 23:59:59.999Z`);

    // -------------------------------------------------------------------------
    // Test 7: Search with zero results
    // -------------------------------------------------------------------------
    console.log("\nTest 7: Testing search with zero matching results...");
    const { req: req7, res: res7, getResult: getResult7, next: next7 } = mockReqRes({
      user: userA,
      query: { search: "xylophone_nonexistent_xyz" },
    });
    await getEmails(req7, res7, next7);
    const r7 = getResult7();

    if (r7.data.count !== 0 || r7.data.emails.length !== 0 || r7.data.pagination.total !== 0) {
      throw new Error(`Test 7 Failed: Expected 0 results, got ${r7.data.count}`);
    }
    console.log(`PASS: Test 7 - Zero-result search returned empty array and total=0 cleanly`);

    // -------------------------------------------------------------------------
    // Test 8: Pagination (page 1 and page 2 for 25 emails)
    // -------------------------------------------------------------------------
    console.log("\nTest 8: Testing server-side pagination (?page=1&limit=20 vs ?page=2&limit=20)...");
    const { req: req8a, res: res8a, getResult: getResult8a, next: next8a } = mockReqRes({
      user: userA,
      query: { page: "1", limit: "20" },
    });
    await getEmails(req8a, res8a, next8a);
    const r8a = getResult8a();

    if (r8a.data.emails.length !== 20 || r8a.data.pagination.hasNextPage !== true) {
      throw new Error(`Test 8a Failed: Expected 20 emails with hasNextPage=true, got length=${r8a.data.emails.length}`);
    }

    const { req: req8b, res: res8b, getResult: getResult8b, next: next8b } = mockReqRes({
      user: userA,
      query: { page: "2", limit: "20" },
    });
    await getEmails(req8b, res8b, next8b);
    const r8b = getResult8b();

    if (r8b.data.emails.length !== 5 || r8b.data.pagination.hasNextPage !== false) {
      throw new Error(`Test 8b Failed: Expected 5 emails on page 2 with hasNextPage=false, got length=${r8b.data.emails.length}`);
    }
    console.log(`PASS: Test 8 - Pagination verified: Page 1 (20/25, hasNextPage: true), Page 2 (5/25, hasNextPage: false)`);

    // -------------------------------------------------------------------------
    // Test 9: Sort order (?sort=oldest vs ?sort=newest)
    // -------------------------------------------------------------------------
    console.log("\nTest 9: Testing sort order (?sort=oldest)...");
    const { req: req9, res: res9, getResult: getResult9, next: next9 } = mockReqRes({
      user: userA,
      query: { sort: "oldest", limit: "5" },
    });
    await getEmails(req9, res9, next9);
    const r9 = getResult9();

    const d0 = new Date(r9.data.emails[0].date).getTime();
    const d1 = new Date(r9.data.emails[1].date).getTime();
    if (d0 > d1) {
      throw new Error("Test 9 Failed: Expected oldest emails first with sort=oldest");
    }
    console.log(`PASS: Test 9 - Sort order verified: First email date: ${r9.data.emails[0].date} <= Second email date: ${r9.data.emails[1].date}`);

    // -------------------------------------------------------------------------
    // Test 10: Multi-tenant security isolation
    // -------------------------------------------------------------------------
    console.log("\nTest 10: Testing multi-tenant security isolation...");
    // User A searches for "Secret"
    const { req: req10a, res: res10a, getResult: getResult10a, next: next10a } = mockReqRes({
      user: userA,
      query: { search: "Secret" },
    });
    await getEmails(req10a, res10a, next10a);
    const r10a = getResult10a();
    if (r10a.data.count !== 0) {
      throw new Error(`Test 10 Failed: User A was able to see User B's secret email!`);
    }

    // User B searches for "Secret"
    const { req: req10b, res: res10b, getResult: getResult10b, next: next10b } = mockReqRes({
      user: userB,
      query: { search: "Secret" },
    });
    await getEmails(req10b, res10b, next10b);
    const r10b = getResult10b();
    if (r10b.data.count !== 1 || r10b.data.emails[0].gmailMessageId !== "search-msg-userb") {
      throw new Error(`Test 10 Failed: User B could not find their own email.`);
    }
    console.log(`PASS: Test 10 - Security isolation confirmed: User A cannot access User B's emails.`);

    // -------------------------------------------------------------------------
    // Test 11: Clear filters returns default fast Redis Inbox
    // -------------------------------------------------------------------------
    console.log("\nTest 11: Testing filter reset returns default Redis inbox...");
    const { req: req11, res: res11, getResult: getResult11, next: next11 } = mockReqRes({
      user: userA,
      query: {},
    });
    const t11Start = Date.now();
    await getEmails(req11, res11, next11);
    const t11Duration = Date.now() - t11Start;
    const r11 = getResult11();

    if (r11.data.source !== "cache" || t11Duration > 20) {
      throw new Error(`Test 11 Failed: Clearing filters should restore fast Redis cache hit`);
    }
    console.log(`PASS: Test 11 - Reset to default inbox hit Redis in ${t11Duration}ms (source: ${r11.data.source})`);

    console.log("\nALL 11 SEARCH, FILTER & PAGINATION TESTS PASSED SUCCESSFULLY!");
  } finally {
    // Clean up test data
    await Email.deleteMany({ userId: { $in: [userAId, userBId] } });
    await User.deleteMany({ _id: { $in: [userAId, userBId] } });
    if (redisClient?.isOpen) {
      await redisClient.del(`prioritypulse:emails:${userAId.toString()}`);
      await redisClient.del(`prioritypulse:emails:${userBId.toString()}`);
    }
    await mongoose.disconnect();
  }
}

runSearchAndFilterTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test Suite Failed:", err);
    process.exit(1);
  });
