const {
  classifyEmail,
  classifyEmailsBatch,
} = require("../services/emailClassificationService");

async function runTests() {
  const testCases = [
    {
      name: "1. Normal work email",
      email: {
        sender: "colleague@company.com",
        subject: "Sprint 24 planning notes and tickets update",
        body: "Please review the backlog items and update your assigned tasks before standup.",
      },
      expected: "MEDIUM",
    },
    {
      name: "2. Meeting invitation",
      email: {
        sender: "lead@company.com",
        subject: "Team sync meeting today at 3 PM",
        body: "We need to sync on the client architecture roadmap today.",
      },
      expected: "HIGH",
    },
    {
      name: "3. Deadline/urgent email",
      email: {
        sender: "boss@company.com",
        subject: "URGENT: Final project submission deadline is tonight",
        body: "Action required immediately to submit the deliverables before 11:59 PM.",
      },
      expected: "HIGH",
    },
    {
      name: "4. Bank/financial alert",
      email: {
        sender: "alerts@chase.com",
        subject: "Urgent: Suspicious transaction detected on your credit card",
        body: "A payment of $1,420.00 was attempted. Confirm your account immediately.",
      },
      expected: "HIGH",
    },
    {
      name: "5. Job/recruitment email",
      email: {
        sender: "recruiting@stripe.com",
        subject: "Interview Invitation: Senior Software Engineer",
        body: "We would love to invite you for a technical interview round tomorrow.",
      },
      expected: "HIGH",
    },
    {
      name: "6. Casual/personal email",
      email: {
        sender: "friend@gmail.com",
        subject: "Hey! Weekend coffee catch up?",
        body: "Are you free this Saturday afternoon to grab some coffee and chat?",
      },
      expected: "LOW",
    },
    {
      name: "7. Newsletter/promotional email",
      email: {
        sender: "deals@store.com",
        subject: "Summer mega sale! 50% discount on all items",
        body: "Limited time coupon code. Unsubscribe from marketing newsletter.",
      },
      expected: "LOW",
    },
  ];

  console.log("=== Test 1: Single Email Classification with XAI Explainability ===");
  let allPassed = true;
  for (const tc of testCases) {
    const result = await classifyEmail(tc.email);
    console.log(`Test: ${tc.name}`);
    console.log(`Result: priority=${result.priority}, confidence=${result.confidence}`);
    console.log(`AI Reasons: ${JSON.stringify(result.aiReasons)}`);
    const passed =
      result.priority === tc.expected &&
      Array.isArray(result.aiReasons) &&
      result.aiReasons.length > 0;
    console.log(`Status: ${passed ? "PASS" : "FAIL"}\n`);
    if (!passed) allPassed = false;
  }

  console.log("=== Test 2: Batch Email Classification (Single HTTP Call) ===");
  const batchStart = Date.now();
  const batchInputs = testCases.map((tc) => tc.email);
  const batchResults = await classifyEmailsBatch(batchInputs);
  const batchDuration = Date.now() - batchStart;

  console.log(`Batch processed ${batchResults.length} emails in ${batchDuration}ms`);
  for (let i = 0; i < testCases.length; i++) {
    const res = batchResults[i];
    const exp = testCases[i].expected;
    console.log(
      `Batch [${i}] ${testCases[i].name} -> priority=${res.priority}, confidence=${res.confidence}, reasons=${res.aiReasons?.length}`
    );
    if (res.priority !== exp) {
      console.error(`FAIL: Expected ${exp}, got ${res.priority}`);
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log("\nSUCCESS: All 7 single and batch classification tests with XAI passed!");
    process.exit(0);
  } else {
    console.error("\nFAILURE: Some classification tests failed.");
    process.exit(1);
  }
}

runTests();
