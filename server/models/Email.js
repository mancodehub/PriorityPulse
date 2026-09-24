const mongoose = require("mongoose");

const emailSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    gmailMessageId: {
      type: String,
      required: true,
    },

    threadId: {
      type: String,
      default: null,
    },

    sender: {
      type: String,
      default: "",
    },

    recipient: {
      type: String,
      default: "",
    },

    subject: {
      type: String,
      default: "(No subject)",
    },

    body: {
      type: String,
      default: "",
    },

    preview: {
      type: String,
      default: "",
    },

    date: {
      type: Date,
      default: null,
    },

    unread: {
      type: Boolean,
      default: true,
    },

    localReadAt: {
      type: Date,
      default: null,
    },

    priority: {
      type: String,
      enum: ["HIGH", "MEDIUM", "LOW"],
      default: "MEDIUM",
    },

    confidence: {
      type: Number,
      default: null,
    },

    mlPriority: {
      type: String,
      enum: ["HIGH", "MEDIUM", "LOW", null],
      default: null,
    },

    mlConfidence: {
      type: Number,
      default: null,
    },

    aiReasons: {
      type: [String],
      default: [],
    },

    matchedKeywords: [
      {
        keyword: { type: String, trim: true },
        priority: { type: String, enum: ["HIGH", "MEDIUM", "LOW"] },
      },
    ],

    important: {
      type: Boolean,
      default: false,
    },

    gmailLabels: {
      type: [String],
      default: [],
    },

    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },

    bodyHtml: {
      type: String,
      default: "",
    },

    bodyText: {
      type: String,
      default: "",
    },

    hasFullBody: {
      type: Boolean,
      default: false,
    },

    bodyFetchedAt: {
      type: Date,
      default: null,
    },

    attachments: [
      {
        attachmentId: { type: String, default: "" },
        filename: { type: String, default: "" },
        mimeType: { type: String, default: "" },
        size: { type: Number, default: 0 },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Same Gmail email should never be duplicated for the same user.
emailSchema.index(
  { userId: 1, gmailMessageId: 1 },
  { unique: true }
);

// Latest emails first.
emailSchema.index({ userId: 1, date: -1 });

// Filtering and sorting compound indexes
emailSchema.index({ userId: 1, priority: 1, date: -1 });
emailSchema.index({ userId: 1, unread: 1, date: -1 });
emailSchema.index({ userId: 1, priority: 1, unread: 1, date: -1 });

module.exports = mongoose.model("Email", emailSchema);
