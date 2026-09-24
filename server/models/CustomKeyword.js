const mongoose = require("mongoose");

const customKeywordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    keyword: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 120,
    },
    normalizedKeyword: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 120,
    },
    priority: {
      type: String,
      enum: ["HIGH", "MEDIUM", "LOW"],
      default: "LOW",
    },
    enabled: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

customKeywordSchema.index(
  { userId: 1, normalizedKeyword: 1 },
  { unique: true }
);

customKeywordSchema.pre("validate", function setNormalizedKeyword(next) {
  this.keyword = String(this.keyword || "").trim().toLowerCase();
  this.normalizedKeyword = this.keyword;
  next();
});

module.exports = mongoose.model("CustomKeyword", customKeywordSchema);
