# PriorityPulse Machine Learning Service

Real-Time Email Priority Classification Microservice for PriorityPulse.

This service uses Scikit-Learn (`TfidfVectorizer` + `LogisticRegression`) to classify incoming emails into **HIGH**, **MEDIUM**, or **LOW** priority with calibrated confidence scores (between 0.0 and 1.0).

---

## 1. Directory Structure

```
ml-service/
├── app.py                     # FastAPI application endpoints (/health, /predict)
├── requirements.txt           # Python dependencies
├── README.md                  # Service documentation and run instructions
└── model/
    ├── classifier.py          # ML pipeline, balanced dataset, training & inference
    └── priority_model.pkl     # Serialized Scikit-Learn model pipeline
```

---

## 2. Installation & Requirements

Ensure Python 3.10+ is installed.

Install the required dependencies:

```bash
cd ml-service
pip install -r requirements.txt
```

### Dependencies
- `fastapi` (REST API framework)
- `uvicorn` (ASGI web server)
- `scikit-learn` (TF-IDF vectorizer and Logistic Regression)
- `joblib` (Model persistence)
- `numpy` & `pandas` (Data processing)
- `pydantic` (Request/response validation)

---

## 3. Training the Model

The model is trained on a balanced dataset covering:
- **HIGH**: Urgent issues, server outages, job offers, interview invites, security alerts, OTP codes, billing deadlines.
- **MEDIUM**: Sprint updates, team discussions, PR reviews, documentation, timesheets, roadmap planning.
- **LOW**: Promotions, newsletters, discount codes, clearance sales, marketing campaigns, unsubscribe notices.

To retrain the model and save the artifact:

```bash
cd ml-service
python model/classifier.py
```

The trained model pipeline is saved to `model/priority_model.pkl`.

---

## 4. Running the Service

Start the FastAPI microservice on `http://127.0.0.1:8000`:

```bash
cd ml-service
python -m uvicorn app:app --reload --port 8000
```

Alternatively:
```bash
python app.py
```

Interactive API documentation (Swagger UI) is available at:
- `http://localhost:8000/docs`

---

## 5. API Reference

### Health Check
- **Endpoint**: `GET /health`
- **Response**:
```json
{
  "status": "ML service is healthy"
}
```

### Predict Priority
- **Endpoint**: `POST /predict`
- **Content-Type**: `application/json`
- **Request Body**:
```json
{
  "sender": "alerts@chase.com",
  "subject": "Urgent: Suspicious transaction detected on your credit card",
  "body": "A payment of $1,420.00 was attempted at Best Buy. Please confirm immediately."
}
```
- **Response Body**:
```json
{
  "priority": "HIGH",
  "confidence": 0.85
}
```

### Predict Batch Priority (Optimized for Sync)
- **Endpoint**: `POST /predict-batch`
- **Content-Type**: `application/json`
- **Request Body**:
```json
{
  "emails": [
    {
      "sender": "alerts@chase.com",
      "subject": "Urgent: Suspicious transaction detected",
      "body": "Confirm immediately."
    },
    {
      "sender": "deals@store.com",
      "subject": "50% off clearance sale",
      "body": "Unsubscribe here."
    }
  ]
}
```
- **Response Body**:
```json
{
  "predictions": [
    {
      "priority": "HIGH",
      "confidence": 0.88
    },
    {
      "priority": "LOW",
      "confidence": 0.86
    }
  ]
}
```

---

## 6. Testing with cURL / PowerShell

### Health check
```bash
curl -X GET http://127.0.0.1:8000/health
```

### Prediction check
```bash
curl -X POST http://127.0.0.1:8000/predict \
  -H "Content-Type: application/json" \
  -d "{\"sender\":\"recruiting@google.com\",\"subject\":\"Interview invitation for tomorrow\",\"body\":\"Please confirm your technical interview time.\"}"
```
