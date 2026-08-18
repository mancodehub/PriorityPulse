const express = require("express");
const { getEmails, getEmailById } = require("../controllers/emailController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.get("/", getEmails);
router.get("/:id", getEmailById);

module.exports = router;
