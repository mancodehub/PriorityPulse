require("dotenv").config();

const { Resend } = require("resend");

const apiKey = process.env.RESEND_API_KEY?.trim();
const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();

const resend = apiKey ? new Resend(apiKey) : null;

// Kept for compatibility with existing server.js.
// This checks configuration, not remote email delivery.
const verifySmtp = async () => {
  if (!apiKey || !fromEmail) {
    throw new Error(
      "Resend configuration missing: RESEND_API_KEY or RESEND_FROM_EMAIL"
    );
  }

  console.log("Resend email service configured");
  return true;
};

const sendOtpEmail = async (to, otp) => {
  if (!resend || !fromEmail) {
    const error = new Error(
      "Email service is not configured on the server."
    );
    error.statusCode = 500;
    throw error;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: "Your PriorityPulse Login OTP",
      text:
        `Your PriorityPulse OTP is ${otp}. ` +
        "This code will expire in 5 minutes.",
      html: `
        <div style="font-family:Arial,sans-serif;
                    max-width:500px;margin:auto;">
          <h2>PriorityPulse</h2>
          <p>Your login verification code is:</p>
          <div style="font-size:32px;font-weight:bold;
                      letter-spacing:8px;margin:20px 0;">
            ${otp}
          </div>
          <p>This OTP will expire in
             <strong>5 minutes</strong>.</p>
          <p>If you did not request this code,
             you can safely ignore this email.</p>
          <hr />
          <p style="color:#777;font-size:12px;">
            PriorityPulse - Email Priority Classification
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("[Resend Error]", {
        name: error.name,
        message: error.message,
      });

      const emailError = new Error(
        "Failed to send verification email. Please try again."
      );
      emailError.statusCode = 500;
      throw emailError;
    }

    console.log("OTP email accepted by Resend", {
      emailId: data?.id,
    });

    return data;
  } catch (err) {
    console.error("[Email Delivery Error]", {
      name: err.name,
      message: err.message,
    });

    const emailError = new Error(
      "Failed to send verification email. Please try again."
    );
    emailError.statusCode = 500;
    throw emailError;
  }
};

module.exports = {
  verifySmtp,
  sendOtpEmail,
};