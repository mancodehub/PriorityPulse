require("dotenv").config();

const http = require("http");
const mongoose = require("mongoose");
const app = require("./app");
const connectDB = require("./config/db");

const { verifySmtp } = require("./config/email");
const { connectRedis, redisClient } = require("./config/redis");
const { initSocketServer } = require("./config/socket");
const {
  startBackgroundSync,
  stopBackgroundSync,
} = require("./services/backgroundSyncService");

const PORT = process.env.PORT || 5000;
let isShuttingDown = false;

const shutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`[Server] ${signal} received; shutting down gracefully.`);
  stopBackgroundSync();

  await new Promise((resolve) => {
    server.close(() => resolve());
  }).catch(() => {});

  if (redisClient.isOpen) {
    await redisClient.quit().catch(() => {});
  }
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close().catch(() => {});
  }
};

process.once("SIGINT", () => shutdown("SIGINT").finally(() => process.exit(0)));
process.once("SIGTERM", () => shutdown("SIGTERM").finally(() => process.exit(0)));

console.log("Server file started");
console.log("Mongo URI:", process.env.MONGO_URI ? "Found" : "Missing");

// Create HTTP server for Express + Socket.io
const server = http.createServer(app);

// Initialize Socket.io on the HTTP server
initSocketServer(server);

// Connect MongoDB first
connectDB()
  .then(async () => {
    console.log("Database connected.");

    // Connect Redis
    try {
      await connectRedis();
      console.log("Redis connection established successfully.");
    } catch (redisErr) {
      console.warn("Redis connection warning:", redisErr.message);
    }

    // Verify SMTP
    try {
      await verifySmtp();
      console.log("SMTP connection verified successfully.");
    } catch (smtpErr) {
      console.warn("SMTP verification warning:", smtpErr.message);
    }

    // Start HTTP + Socket.io server
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);

      // Start automatic background sync scheduler non-blocking
      startBackgroundSync();
    });
  })
  .catch((error) => {
    console.error("Connection Error:", error.message);
    process.exit(1);
  });
