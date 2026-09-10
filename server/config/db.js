const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing");
    }

    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: Number(process.env.MONGO_TIMEOUT_MS || 5000),
    });

    console.log("MongoDB Connected");
  } catch (error) {
    console.log("MongoDB Error:");
    console.log(error.message);
    throw error;
  }
};

module.exports = connectDB;
