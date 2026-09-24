const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const http = require("http");
const jwt = require("jsonwebtoken");
const { io: Client } = require("../../node_modules/socket.io-client");
const { initSocketServer, emitNewEmailToUser } = require("../config/socket");

async function runSocketTests() {
  console.log("=== RUNNING REAL-TIME SOCKET.IO NOTIFICATION INTEGRATION TESTS ===\n");

  const PORT = 5099;
  const httpServer = http.createServer();
  const ioServer = initSocketServer(httpServer);

  await new Promise((resolve) => httpServer.listen(PORT, resolve));
  console.log(`Test Socket Server listening on port ${PORT}`);

  const userAId = "654321098765432109876543";
  const userBId = "987654321098765432109876";

  const tokenA = jwt.sign({ userId: userAId }, process.env.JWT_SECRET || "default_jwt_secret_prioritypulse");
  const tokenB = jwt.sign({ userId: userBId }, process.env.JWT_SECRET || "default_jwt_secret_prioritypulse");

  // Test 1: Reject unauthenticated client
  console.log("Test 1: Testing rejection of unauthenticated socket connection...");
  const unauthClient = Client(`http://localhost:${PORT}`, {
    autoConnect: true,
    transports: ["websocket"],
  });

  const unauthError = await new Promise((resolve) => {
    unauthClient.on("connect_error", (err) => {
      resolve(err.message);
    });
  });
  console.log(`Received expected rejection: "${unauthError}"`);
  unauthClient.close();

  // Test 2: Authenticate User A and User B
  console.log("\nTest 2: Testing authenticated connections for User A and User B...");
  const clientA = Client(`http://localhost:${PORT}`, {
    auth: { token: tokenA },
    transports: ["websocket"],
  });

  const clientB = Client(`http://localhost:${PORT}`, {
    auth: { token: tokenB },
    transports: ["websocket"],
  });

  await Promise.all([
    new Promise((resolve) => clientA.on("connect", resolve)),
    new Promise((resolve) => clientB.on("connect", resolve)),
  ]);
  console.log("PASS: Both User A and User B successfully authenticated and joined their private rooms.");

  // Test 3: Targeted event emission to User A only
  console.log("\nTest 3: Testing room-targeted new-email and high-priority-email event emission...");
  let userAReceived = null;
  let userAHighPriorityReceived = null;
  let userBReceived = null;

  clientA.on("new-email", (email) => {
    userAReceived = email;
  });

  clientA.on("high-priority-email", (payload) => {
    userAHighPriorityReceived = payload;
  });

  clientB.on("new-email", (email) => {
    userBReceived = email;
  });

  const testEmailData = {
    id: "gmail-test-999",
    gmailMessageId: "gmail-test-999",
    subject: "Urgent: Project Meeting Tomorrow",
    sender: "manager@example.com",
    priority: "HIGH",
    confidence: 0.94,
    preview: "Action required on sprint deliverables.",
    date: new Date().toISOString(),
  };

  emitNewEmailToUser(userAId, testEmailData);

  // Wait 500ms for event propagation
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (!userAReceived) {
    throw new Error("User A did not receive the new-email event!");
  }

  console.log("User A received event payload:", userAReceived);
  if (userAReceived.id !== "gmail-test-999" || userAReceived.priority !== "HIGH") {
    throw new Error("User A received unexpected payload content!");
  }

  if (!userAHighPriorityReceived) {
    throw new Error("User A did not receive the high-priority-email event!");
  }
  console.log("PASS: User A received high-priority-email event:", userAHighPriorityReceived);

  if (userBReceived !== null) {
    throw new Error("Security violation: User B received an email meant for User A!");
  }
  console.log("PASS: User B did NOT receive User A's email (room isolation confirmed).");

  // Cleanup
  clientA.close();
  clientB.close();
  ioServer.close();
  await new Promise((resolve) => httpServer.close(resolve));

  console.log("\nALL REAL-TIME SOCKET.IO NOTIFICATION TESTS PASSED SUCCESSFULLY!");
  process.exit(0);
}

runSocketTests().catch((err) => {
  console.error("\nTEST SUITE FAILED:", err);
  process.exit(1);
});
