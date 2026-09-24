const axios = require("axios");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";
const ML_TIMEOUT_MS = 7000;

const fallbackPrediction = () => ({
  priority: "MEDIUM",
  confidence: null,
  aiReasons: ["AI classification unavailable"],
});

const normalizePrediction = (prediction = {}) => {
  const rawPriority = String(prediction.priority || "MEDIUM").toUpperCase();
  const aiReasons = Array.isArray(prediction.reasons)
    ? prediction.reasons.filter((reason) => typeof reason === "string" && reason.trim()).slice(0, 5)
    : [];

  return {
    priority: ["HIGH", "MEDIUM", "LOW"].includes(rawPriority) ? rawPriority : "MEDIUM",
    confidence: typeof prediction.confidence === "number"
      ? Math.max(0, Math.min(1, prediction.confidence))
      : null,
    aiReasons: aiReasons.length > 0 ? aiReasons : ["Model explanation unavailable"],
  };
};

const classifyEmail = async ({ sender = "", subject = "", body = "" } = {}) => {
  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/predict`,
      { sender, subject, body },
      { timeout: ML_TIMEOUT_MS },
    );
    return normalizePrediction(response.data);
  } catch (error) {
    console.error(`[ML] Classification failed: ${error.message}`);
    return fallbackPrediction();
  }
};

const classifyEmailsBatch = async (emails = []) => {
  if (!Array.isArray(emails) || emails.length === 0) return [];

  const startedAt = Date.now();
  const fallbackList = emails.map(() => fallbackPrediction());
  console.log(`[ML] Batch classification started (${emails.length} emails)`);

  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/predict-batch`,
      {
        emails: emails.map((item) => ({
          sender: item?.sender || "",
          subject: item?.subject || "",
          body: item?.body || "",
        })),
      },
      { timeout: ML_TIMEOUT_MS },
    );

    const predictions = response.data?.predictions;
    if (!Array.isArray(predictions) || predictions.length !== emails.length) {
      console.warn(`[ML] Classification failed: prediction count mismatch (${predictions?.length || 0}/${emails.length})`);
      return fallbackList;
    }

    const normalized = predictions.map(normalizePrediction);
    console.log(`[ML] Classified ${normalized.length} emails`);
    console.log(`[ML] Classification completed in ${Date.now() - startedAt}ms`);
    return normalized;
  } catch (error) {
    console.error(`[ML] Classification service unavailable: ${error.message}`);
    return fallbackList;
  }
};

module.exports = { classifyEmail, classifyEmailsBatch };
