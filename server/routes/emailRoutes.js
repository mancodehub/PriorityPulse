const express = require("express");
const { getEmails } = require("../controllers/emailController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, getEmails);

module.exports = router;