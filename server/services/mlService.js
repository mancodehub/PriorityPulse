const { spawn } = require('child_process');
const path = require('path');

const PREDICT_SCRIPT = path.resolve(__dirname, '../../ml/predict.py');
const PYTHON_CMD = process.env.PYTHON_CMD || 'python';
const PREDICTION_TIMEOUT_MS = 15000;

/**
 * Default fallback prediction when Python ML service is unavailable.
 */
function getFallbackPrediction(email = {}) {
  return {
    priority: 'MEDIUM',
    confidence: 50,
    confidence_score: 0.5,
    important: false,
    reasons: [
      'ML classifier fallback: using default priority.',
      'Routine priority assigned pending ML analysis.'
    ],
    id: email.id || undefined,
    fallback: true
  };
}

/**
 * Classifies an array of emails using the Python ML classifier.
 *
 * @param {Array<Object>} emails
 * @returns {Promise<Array<Object>>}
 */
async function classifyEmails(emails = []) {
  if (!Array.isArray(emails) || emails.length === 0) {
    return [];
  }

  return new Promise((resolve) => {
    let resolved = false;

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.warn('[ML Service] Python prediction timed out, using fallback predictions.');
        try {
          pyProcess.kill();
        } catch (e) {}
        resolve(emails.map(getFallbackPrediction));
      }
    }, PREDICTION_TIMEOUT_MS);

    let pyProcess;
    try {
      pyProcess = spawn(PYTHON_CMD, ['-u', PREDICT_SCRIPT], {
        stdio: ['pipe', 'pipe', 'pipe']
      });
    } catch (err) {
      clearTimeout(timeout);
      console.warn('[ML Service] Could not spawn Python process:', err.message);
      return resolve(emails.map(getFallbackPrediction));
    }

    let stdoutData = '';
    let stderrData = '';

    pyProcess.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString();
    });

    pyProcess.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
    });

    pyProcess.on('error', (err) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        console.warn('[ML Service] Python process error:', err.message);
        resolve(emails.map(getFallbackPrediction));
      }
    });

    pyProcess.on('close', (code) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeout);

      if (code !== 0) {
        console.warn('[ML Service] Python process exited with non-zero code ' + code + ':', stderrData);
        return resolve(emails.map(getFallbackPrediction));
      }

      try {
        const predictions = JSON.parse(stdoutData.trim());
        if (Array.isArray(predictions) && predictions.length === emails.length) {
          return resolve(predictions);
        } else if (Array.isArray(predictions)) {
          // If length mismatch, pad with fallbacks
          return resolve(
            emails.map((email, idx) => predictions[idx] || getFallbackPrediction(email))
          );
        } else if (predictions && typeof predictions === 'object') {
          return resolve([predictions]);
        } else {
          console.warn('[ML Service] Unexpected prediction output format:', stdoutData);
          return resolve(emails.map(getFallbackPrediction));
        }
      } catch (parseErr) {
        console.warn('[ML Service] Failed to parse Python output as JSON:', parseErr.message, stdoutData);
        return resolve(emails.map(getFallbackPrediction));
      }
    });

    try {
      pyProcess.stdin.write(JSON.stringify(emails));
      pyProcess.stdin.end();
    } catch (writeErr) {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        console.warn('[ML Service] Error writing to Python stdin:', writeErr.message);
        resolve(emails.map(getFallbackPrediction));
      }
    }
  });
}

/**
 * Classifies a single email using the Python ML classifier.
 *
 * @param {Object} email
 * @returns {Promise<Object>}
 */
async function classifySingleEmail(email) {
  const results = await classifyEmails([email]);
  return results[0] || getFallbackPrediction(email);
}

module.exports = {
  classifyEmails,
  classifySingleEmail,
  getFallbackPrediction
};
