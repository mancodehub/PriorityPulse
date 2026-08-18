const mongoose = require("mongoose");

const emailSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sender: {
      type: String,
      required: true,
      trim: true,
    },
    senderEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    preview: {
      type: String,
      default: "",
    },
    body: {
      type: String,
      default: "",
    },
    priority: {
      type: String,
      enum: ["HIGH", "MEDIUM", "LOW"],
      default: "LOW",
      index: true,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    unread: {
      type: Boolean,
      default: true,
    },
    important: {
      type: Boolean,
      default: false,
    },
    receivedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    reasons: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

emailSchema.virtual("id").get(function getId() {
  return this._id.toString();
});

module.exports = mongoose.model("Email", emailSchema);
