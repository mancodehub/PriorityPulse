const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendOtpEmail = async (to, otp) => {
  await transporter.sendMail({
    from: `"PriorityPulse" <${process.env.SMTP_USER}>`,
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
};

module.exports = {
  sendOtpEmail,
};