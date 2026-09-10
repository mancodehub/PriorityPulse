const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
      default: "",
    },
    lastLoginAt: {
      type: Date,
    },
    gmailConnected: {
      type: Boolean,
      default: false,
    },
    googleEmail: {
      type: String,
      default: null,
    },

    gmailAccessToken: {
      type: String,
      default: null,
    },

    gmailRefreshToken: {
      type: String,
      default: null,
    },

    gmailTokenExpiry: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
