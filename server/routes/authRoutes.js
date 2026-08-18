const express = require("express");
const { sendOtp, verifyOtp, getMe } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.get("/me", authMiddleware, getMe);

module.exports = router;
