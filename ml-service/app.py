import os
import sys
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure ml-service root and model directory are on sys.path
CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

from model.classifier import load_model, predict_priority, predict_priority_batch


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager to pre-load model into memory on startup."""
    print("Pre-loading priority classification model into memory...")
    try:
        load_model()
        print("ML model successfully loaded and ready for predictions.")
    except Exception as e:
        print(f"Warning: Failed to pre-load ML model during startup: {e}")
    yield


app = FastAPI(
    title="PriorityPulse ML Service",
    description="Real-Time Email Priority Classification Microservice",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for local development and backend services
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class EmailPredictRequest(BaseModel):
    sender: str = Field(default="", description="Email sender name or address")
    subject: str = Field(default="", description="Email subject line")
    body: str = Field(default="", description="Email body snippet or plain text")


class EmailPredictResponse(BaseModel):
    priority: str = Field(description="Classified priority: HIGH, MEDIUM, or LOW")
    confidence: float = Field(description="Confidence score between 0.0 and 1.0")
    reasons: list[str] = Field(default_factory=list, description="Model-derived explanation signals")


class HealthResponse(BaseModel):
    status: str = Field(default="ML service is healthy")
    model_loaded: bool = False


class BatchEmailPredictRequest(BaseModel):
    emails: list[EmailPredictRequest] = Field(
        default_factory=list, description="List of emails to batch classify"
    )


class BatchEmailPredictResponse(BaseModel):
    predictions: list[EmailPredictResponse] = Field(
        default_factory=list, description="List of predictions in matching order"
    )


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint to verify service and model availability."""
    try:
        load_model()
        return HealthResponse(status="ok", model_loaded=True)
    except Exception:
        return HealthResponse(status="degraded", model_loaded=False)


@app.post("/predict", response_model=EmailPredictResponse)
async def predict(request: EmailPredictRequest):
    """
    Predict email priority and confidence based on sender, subject, and body.
    """
    try:
        result = predict_priority(
            sender=request.sender or "",
            subject=request.subject or "",
            body=request.body or "",
        )
        return EmailPredictResponse(
            priority=result["priority"],
            confidence=result["confidence"],
            reasons=result.get("reasons", []),
        )
    except Exception as err:
        print(f"Prediction error in ML microservice: {err}")
        # Return fallback rather than hard 500 crash so caller always gets valid response
        return EmailPredictResponse(
            priority="MEDIUM",
            confidence=0.0,
        )


@app.post("/predict-batch", response_model=BatchEmailPredictResponse)
async def predict_batch(request: BatchEmailPredictRequest):
    """
    Batch classify emails in a single vectorized inference call.
    """
    try:
        raw_emails = [
            {
                "sender": em.sender or "",
                "subject": em.subject or "",
                "body": em.body or "",
            }
            for em in request.emails
        ]
        results = predict_priority_batch(raw_emails)
        return BatchEmailPredictResponse(
            predictions=[
                EmailPredictResponse(
                    priority=r["priority"],
                    confidence=r["confidence"],
                    reasons=r.get("reasons", []),
                )
                for r in results
            ]
        )
    except Exception as err:
        print(f"Batch prediction error in ML microservice: {err}")
        # Return fallback for every email in the batch
        return BatchEmailPredictResponse(
            predictions=[
                EmailPredictResponse(priority="MEDIUM", confidence=0.0)
                for _ in request.emails
            ]
        )


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    print(f"Starting PriorityPulse ML Service on http://127.0.0.1:{port}...")
    uvicorn.run(app, host="127.0.0.1", port=port)
