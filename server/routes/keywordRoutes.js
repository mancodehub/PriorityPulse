const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getKeywords,
  createKeyword,
  updateKeyword,
  deleteKeyword,
  refreshKeywordMatches,
} = require("../controllers/keywordController");

const router = express.Router();

router.get("/", authMiddleware, getKeywords);
router.post("/", authMiddleware, createKeyword);
router.patch("/:id", authMiddleware, updateKeyword);
router.delete("/:id", authMiddleware, deleteKeyword);
router.post("/refresh", authMiddleware, refreshKeywordMatches);

module.exports = router;
