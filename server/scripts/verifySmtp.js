require("dotenv").config();
const { verifySmtp, transporter } = require("../config/email");

async function main() {
  console.log("Starting development SMTP verification...");
  const t0 = Date.now();
  try {
    await verifySmtp();
    const elapsed = Date.now() - t0;
    console.log(`[SUCCESS] SMTP transporter verified in ${elapsed}ms. Ready to send emails.`);
  } catch (err) {
    console.error("[FAILURE] SMTP verification failed:", {
      code: err.code || "UNKNOWN",
      message: err.message,
    });
    process.exit(1);
  } finally {
    if (transporter) {
      transporter.close();
    }
  }
}

main();

