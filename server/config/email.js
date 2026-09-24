require("dotenv").config();
const nodemailer = require("nodemailer");

const smtpUserConfigured = Boolean(process.env.SMTP_USER && process.env.SMTP_USER.trim());
const smtpPassConfigured = Boolean(process.env.SMTP_PASS && process.env.SMTP_PASS.trim());

console.log(`SMTP_USER configured: ${smtpUserConfigured}`);
console.log(`SMTP_PASS configured: ${smtpPassConfigured}`);

let transporter = null;

if (smtpUserConfigured && smtpPassConfigured) {
  transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.SMTP_USER.trim(),
    pass: process.env.SMTP_PASS.trim(),
  },
  connectionTimeout: 15000,
  greetingTimeout: 10000,
  socketTimeout: 20000,
});
} else {
  console.error("Configuration Error: SMTP_USER and/or SMTP_PASS missing in environment variables.");
}

const verifySmtp = async () => {
  if (!transporter) {
    throw new Error("SMTP transporter is not initialized. Check SMTP_USER and SMTP_PASS.");
  }
  return await transporter.verify();
};

const sendOtpEmail = async (to, otp) => {
  if (!transporter) {
    const configError = new Error("Email service is not configured on the server.");
    configError.statusCode = 500;
    throw configError;
  }

  try {
    const info = await transporter.sendMail({
      from: `"PriorityPulse" <${process.env.SMTP_USER.trim()}>`,
      to,
      subject: "Your PriorityPulse Login OTP",
      text: `Your PriorityPulse OTP is ${otp}. This code will expire in 5 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
          <h2>PriorityPulse</h2>
          <p>Your login verification code is:</p>

          <div style="
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            margin: 20px 0;
          ">
            ${otp}
          </div>

          <p>This OTP will expire in <strong>5 minutes</strong>.</p>

          <p>If you did not request this code, you can safely ignore this email.</p>

          <hr />

          <p style="color: #777; font-size: 12px;">
            PriorityPulse — Real-Time High-Priority Email Classification
          </p>
        </div>
      `,
    });

    return info;
  } catch (err) {
    // Internally log safe details without leaking credentials or OTP
    console.error("[SMTP Send Error]", {
      code: err.code || "UNKNOWN",
      command: err.command || "N/A",
      responseCode: err.responseCode || "N/A",
      message: err.message || "Failed to send email",
    });

    const emailError = new Error("Failed to send verification email. Please try again.");
    emailError.statusCode = 500;
    emailError.originalCode = err.code;
    throw emailError;
  }
};

module.exports = {
  transporter,
  verifySmtp,
  sendOtpEmail,
};
