import os
import joblib
import numpy as np
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

# Paths
MODEL_DIR = Path(__file__).resolve().parent
MODEL_FILE = MODEL_DIR / "priority_model.pkl"

# Comprehensive balanced training dataset for PriorityPulse
DATASET = [
    # =========================================================================
    # HIGH PRIORITY (Urgent, Action Required, Deadlines, Security, OTP, Interviews, Outages)
    # =========================================================================
    {
        "sender": "security@google.com",
        "subject": "Critical security alert: New sign-in from unknown device",
        "body": "We detected a login attempt from an unrecognized IP address. If this was not you, please secure your account immediately by changing your password.",
        "label": "HIGH",
    },
    {
        "sender": "alerts@chase.com",
        "subject": "Urgent: Suspicious transaction detected on your credit card",
        "body": "A payment of $1,420.00 was attempted at Best Buy. Please confirm whether this transaction was authorized or contact our fraud prevention team immediately.",
        "label": "HIGH",
    },
    {
        "sender": "recruiting@stripe.com",
        "subject": "Interview Invitation: Senior Software Engineer at Stripe",
        "body": "We were impressed with your profile and would love to invite you for a technical interview round tomorrow at 2:00 PM EST. Please confirm your availability.",
        "label": "HIGH",
    },
    {
        "sender": "boss@company.com",
        "subject": "URGENT: Production server down, clients unable to checkout",
        "body": "The payment gateway is throwing 500 errors. All hands on deck immediately to troubleshoot and resolve the issue. Join the bridge war room now.",
        "label": "HIGH",
    },
    {
        "sender": "noreply@auth.service.com",
        "subject": "Your one-time verification code (OTP) is 849201",
        "body": "Use OTP 849201 to complete your login. This code expires in 5 minutes. Do not share this code with anyone.",
        "label": "HIGH",
    },
    {
        "sender": "hr@enterprise.com",
        "subject": "Formal Job Offer: Senior Full Stack Developer",
        "body": "We are thrilled to extend an offer for the Senior Full Stack Developer position. Please review and sign the attached contract by Friday 5 PM.",
        "label": "HIGH",
    },
    {
        "sender": "billing@aws.amazon.com",
        "subject": "Payment Failed: Account suspension warning for AWS account",
        "body": "Your scheduled payment has failed. Please update your payment method immediately to prevent service interruption and resource termination.",
        "label": "HIGH",
    },
    {
        "sender": "prof.smith@university.edu",
        "subject": "Final project submission deadline is tonight at 11:59 PM",
        "body": "This is a reminder that no late submissions will be accepted for the capstone project. Ensure your GitHub repo and report are uploaded on time.",
        "label": "HIGH",
    },
    {
        "sender": "director@company.com",
        "subject": "Action Required: Sign client contract amendment before closing",
        "body": "The client requires our signed agreement before end of day today to proceed with the Q4 deployment. Please sign electronically ASAP.",
        "label": "HIGH",
    },
    {
        "sender": "pagerduty@company.com",
        "subject": "[Sev-1 Incident] High memory alert on database cluster primary",
        "body": "Memory utilization on db-primary has exceeded 96%. Immediate failover investigation required by on-call engineer.",
        "label": "HIGH",
    },
    {
        "sender": "executive@partner.com",
        "subject": "Emergency meeting regarding contract renegotiation",
        "body": "We must convene immediately today at 3 PM to address the regulatory compliance issue before tomorrow's public announcement.",
        "label": "HIGH",
    },
    {
        "sender": "support@github.com",
        "subject": "Action Required: Personal access token expiration alert",
        "body": "Your personal access token will expire in 24 hours. Regenerate it now to prevent any disruption to your automated CI/CD pipelines.",
        "label": "HIGH",
    },
    {
        "sender": "recruiter@meta.com",
        "subject": "Next steps: Final interview panel schedule",
        "body": "Congratulations on passing the screening round. We have scheduled your final onsite panel for Thursday. Please review the agenda and confirmation link.",
        "label": "HIGH",
    },
    {
        "sender": "verification@bank.com",
        "subject": "Immediate verification required: Account temporarily locked",
        "body": "Multiple failed password attempts were recorded. Please verify your identity via the secure portal immediately to restore access.",
        "label": "HIGH",
    },
    {
        "sender": "lead@company.com",
        "subject": "Critical Bug: Data loss bug identified in v2.3 release",
        "body": "We need an immediate hotfix deployed before morning. Stop current sprint work and join the emergency triage call.",
        "label": "HIGH",
    },
    {
        "sender": "security@paypal.com",
        "subject": "Important security update: Unusual login detected",
        "body": "Action required to protect your PayPal account. We noticed a login from an unverified location. Confirm your identity now.",
        "label": "HIGH",
    },
    {
        "sender": "vp-eng@startup.io",
        "subject": "URGENT: Major client outage escalations",
        "body": "Multiple enterprise customers are experiencing timeouts. Please join the incident response channel immediately.",
        "label": "HIGH",
    },
    {
        "sender": "admin@university.edu",
        "subject": "Urgent deadline: Scholarship verification forms due today",
        "body": "Your scholarship application requires final document verification. Failure to submit today will result in cancellation of funds.",
        "label": "HIGH",
    },
    {
        "sender": "operations@cloud.io",
        "subject": "Action Required: SSL certificate expiring in 12 hours",
        "body": "Your primary domain SSL certificate is set to expire. Renew immediately to prevent customer browser security warnings.",
        "label": "HIGH",
    },
    {
        "sender": "talent@apple.com",
        "subject": "Interview Confirmation: Software Engineer position",
        "body": "Your technical interview with the Apple engineering team is confirmed for Monday at 10 AM PST. Please find the video link attached.",
        "label": "HIGH",
    },

    # =========================================================================
    # MEDIUM PRIORITY (Team Updates, Sprint Notes, Reviews, General Work Correspondence)
    # =========================================================================
    {
        "sender": "scrummaster@company.com",
        "subject": "Sprint 24 Planning and Backlog Grooming Notes",
        "body": "Here are the notes and agreed action items from our sprint planning session. Please ensure your story points and tickets are updated in Jira.",
        "label": "MEDIUM",
    },
    {
        "sender": "colleague@company.com",
        "subject": "Pull Request #118: Added unit tests for authentication service",
        "body": "When you have some time this afternoon, could you please take a look at PR #118? No rush, just want to get it merged before the sprint ends.",
        "label": "MEDIUM",
    },
    {
        "sender": "pm@company.com",
        "subject": "Q3 Product Roadmap Discussion and Status Update",
        "body": "Sharing the draft roadmap slides for next quarter. Feel free to leave comments or suggestions before our general review next Wednesday.",
        "label": "MEDIUM",
    },
    {
        "sender": "design@company.com",
        "subject": "Figma mockups updated for Dashboard settings page",
        "body": "We have updated the design tokens and dark mode contrast in Figma based on engineering feedback. Take a look when convenient.",
        "label": "MEDIUM",
    },
    {
        "sender": "teamlead@company.com",
        "subject": "Weekly Engineering Sync Meeting Agenda",
        "body": "Here is the agenda for our regular Thursday team sync. Let me know if you want to add any topics for open discussion.",
        "label": "MEDIUM",
    },
    {
        "sender": "hr@company.com",
        "subject": "Friendly reminder: Monthly timesheets due next week",
        "body": "Please remember to submit your monthly working hours and expense reports in the portal by next Tuesday.",
        "label": "MEDIUM",
    },
    {
        "sender": "colleague@company.com",
        "subject": "Team lunch and social gathering this Friday",
        "body": "We are organizing a team lunch this Friday at the Italian bistro down the street. Let us know if you can join so we can reserve tables.",
        "label": "MEDIUM",
    },
    {
        "sender": "devops@company.com",
        "subject": "Scheduled maintenance window for staging cluster",
        "body": "Staging servers will undergo routine kernel updates this Saturday between 2:00 AM and 4:00 AM UTC. Production will not be affected.",
        "label": "MEDIUM",
    },
    {
        "sender": "docs@company.com",
        "subject": "Documentation draft for the new Email API integration",
        "body": "The draft guide for the email classification service is ready on Confluence. Feedback on the code snippets is welcome.",
        "label": "MEDIUM",
    },
    {
        "sender": "techlead@company.com",
        "subject": "Architecture proposal: Event-driven Redis caching strategy",
        "body": "Attached is the proposal document for switching to Redis cache invalidation hooks. We will discuss it during next week's tech talk.",
        "label": "MEDIUM",
    },
    {
        "sender": "manager@company.com",
        "subject": "Summary of quarterly customer feedback and NPS survey",
        "body": "Overall satisfaction rose by 8% this quarter. Here is the full summary report and breakdown of common feature requests.",
        "label": "MEDIUM",
    },
    {
        "sender": "teammate@company.com",
        "subject": "Notes from user research session on notification preferences",
        "body": "Shared observations from our 5 user interviews yesterday. Most participants prefer customizable email notification thresholds.",
        "label": "MEDIUM",
    },
    {
        "sender": "support@company.com",
        "subject": "Weekly customer support ticket trends and common issues",
        "body": "Support tickets dropped by 12% following the latest bugfix release. Top remaining tickets relate to OAuth token refresh timeouts.",
        "label": "MEDIUM",
    },
    {
        "sender": "colleague@company.com",
        "subject": "Shared Google Doc: Onboarding checklist for new interns",
        "body": "I created a collaborative checklist for our incoming interns starting next month. Feel free to add setup guides or tips.",
        "label": "MEDIUM",
    },
    {
        "sender": "qa@company.com",
        "subject": "Test suite results for nightly release build 412",
        "body": "All 230 automated integration tests passed in 4 minutes. Nightly build is ready for exploratory testing.",
        "label": "MEDIUM",
    },
    {
        "sender": "product@company.com",
        "subject": "Feature status update: Email search and filtering rollout",
        "body": "The search feature has been deployed to 20% of beta users. Initial response time metrics look stable at under 120ms.",
        "label": "MEDIUM",
    },
    {
        "sender": "analytics@company.com",
        "subject": "Monthly active users analytics dashboard report",
        "body": "Attached is the monthly traffic analytics report showing user engagement trends across our web and mobile applications.",
        "label": "MEDIUM",
    },
    {
        "sender": "coordinator@company.com",
        "subject": "Quarterly all-hands meeting presentation slides",
        "body": "Sharing the slide deck from yesterday's all-hands company meeting. Recording will be uploaded to Google Drive shortly.",
        "label": "MEDIUM",
    },
    {
        "sender": "dev@company.com",
        "subject": "Code review request: Dockerfile optimization and multi-stage builds",
        "body": "Reduced the production container image size by 65%. Please review the PR when you get a chance.",
        "label": "MEDIUM",
    },
    {
        "sender": "partner-eng@cloud.com",
        "subject": "Follow-up notes from our technical integration call",
        "body": "Thanks for speaking with us today. Below is a recap of the API endpoints and rate limit specifications we agreed upon.",
        "label": "MEDIUM",
    },

    # =========================================================================
    # LOW PRIORITY (Newsletters, Promotions, Discounts, Marketing, Unsubscribe)
    # =========================================================================
    {
        "sender": "deals@amazon.com",
        "subject": "Summer Clearance Sale: Up to 60% off electronics & accessories",
        "body": "Huge savings on headphones, smartwatches, and laptop stands. Shop our exclusive deals today while supplies last. Free shipping for Prime members.",
        "label": "LOW",
    },
    {
        "sender": "newsletter@medium.com",
        "subject": "Top stories for you: 10 Python tricks every developer should know",
        "body": "Explore top curated articles, developer insights, and deep dives published by community writers this week. Read story on Medium.",
        "label": "LOW",
    },
    {
        "sender": "promotions@udemy.com",
        "subject": "Flash Sale! Master Machine Learning and AI courses starting at $11.99",
        "body": "Expand your skillset with top-rated online video courses. Sale ends in 24 hours. Click here to claim your discount now.",
        "label": "LOW",
    },
    {
        "sender": "marketing@coursera.org",
        "subject": "Exclusive 30% discount on Professional Certificates",
        "body": "Advance your career with accredited certifications from leading universities. Enroll today to take advantage of this special limited time offer.",
        "label": "LOW",
    },
    {
        "sender": "updates@linkedin.com",
        "subject": "People you may know and top job recommendations this week",
        "body": "See who viewed your profile, trending industry discussions, and new network connections waiting for your confirmation.",
        "label": "LOW",
    },
    {
        "sender": "store@nike.com",
        "subject": "New arrivals are here! Check out the latest running collection",
        "body": "Discover breakthrough performance footwear and apparel designed for speed. Browse the catalog and get free standard delivery on orders over $50.",
        "label": "LOW",
    },
    {
        "sender": "digest@hackernewsletter.com",
        "subject": "Hacker Newsletter #680: Curated tech stories and startups",
        "body": "A weekly roundup of the best tech, programming, and startup links discussed by the community. To unsubscribe, click here.",
        "label": "LOW",
    },
    {
        "sender": "offers@dominos.com",
        "subject": "Weekend Special: Buy one large pizza get one free!",
        "body": "Order online and use coupon code BOGO2026. Available at participating locations this Friday through Sunday only.",
        "label": "LOW",
    },
    {
        "sender": "newsletter@producthunt.com",
        "subject": "Product Hunt Daily: The top 5 coolest new AI tools today",
        "body": "Check out the top-ranked productivity apps and developer utilities launched today. Upvote your favorites and leave feedback for makers.",
        "label": "LOW",
    },
    {
        "sender": "noreply@spotify.com",
        "subject": "Discover Weekly: Fresh tracks tailored to your music taste",
        "body": "Your personalized mixtape with 30 new tracks is ready to stream. Open Spotify now to enjoy your custom playlist.",
        "label": "LOW",
    },
    {
        "sender": "marketing@doordash.com",
        "subject": "$15 off your next 3 dinner deliveries with DashPass",
        "body": "Craving your favorite restaurant food? Enjoy zero delivery fees and $15 off your next three meals. Use promo code YUMMY15.",
        "label": "LOW",
    },
    {
        "sender": "rewards@starbucks.com",
        "subject": "Double Star Day: Earn 2x bonus stars on all iced drinks",
        "body": "Stop by today to double your rewards points towards free handcrafted drinks and bakery treats. Scan your app in store.",
        "label": "LOW",
    },
    {
        "sender": "no-reply@twitter.com",
        "subject": "Highlights from accounts you follow on X",
        "body": "Here are the top posts, viral memes, and conversations that happened while you were away. View notifications on X.",
        "label": "LOW",
    },
    {
        "sender": "promo@uber.com",
        "subject": "Take 25% off your next 2 rides this week",
        "body": "Getting around the city just got cheaper. Your promo code has been automatically applied to your account. Book a ride now.",
        "label": "LOW",
    },
    {
        "sender": "catalog@ikea.com",
        "subject": "Transform your workspace: Affordable home office inspiration",
        "body": "Check out ergonomic chairs, modular desks, and smart cable organizers. Shop the collection online or visit our store.",
        "label": "LOW",
    },
    {
        "sender": "sales@zara.com",
        "subject": "Mid-Season Sale: Up to 50% off select fashion styles",
        "body": "Shop the latest apparel, jackets, and footwear on sale now. Free returns on all domestic orders within 30 days.",
        "label": "LOW",
    },
    {
        "sender": "newsletter@tldr.tech",
        "subject": "TLDR Tech Newsletter: Today's top tech headlines",
        "body": "Byte-sized news covering AI, developer tools, and big tech announcements. Click here to manage your subscription or unsubscribe.",
        "label": "LOW",
    },
    {
        "sender": "offers@aliexpress.com",
        "subject": "Super deals: Mega discount vouchers waiting in your cart",
        "body": "Collect your $5 coupons and shop millions of items with fast delivery. Limited stock available on trending gadget accessories.",
        "label": "LOW",
    },
    {
        "sender": "updates@redditmail.com",
        "subject": "Trending posts in r/webdev and r/programming",
        "body": "Take a look at what the Reddit developer communities are discussing today. Unsubscribe from Reddit email digests in settings.",
        "label": "LOW",
    },
    {
        "sender": "coupons@target.com",
        "subject": "Save $10 on groceries with your Target Circle coupon",
        "body": "Apply this weekly coupon code at checkout to save on household essentials, groceries, and personal care.",
        "label": "LOW",
    },
]

# Global model cache
_cached_model = None


def format_email_text(sender: str = "", subject: str = "", body: str = "") -> str:
    """Format email features into a structured text representation for ML vectorization."""
    s = (sender or "").strip()
    subj = (subject or "").strip()
    b = (body or "").strip()
    return f"From: {s} | Subject: {subj} | Body: {b}"


def build_pipeline() -> Pipeline:
    """Construct Scikit-Learn TF-IDF + LogisticRegression pipeline."""
    return Pipeline(
        [
            (
                "tfidf",
                TfidfVectorizer(
                    ngram_range=(1, 2),
                    max_features=5000,
                    sublinear_tf=True,
                    lowercase=True,
                ),
            ),
            (
                "clf",
                LogisticRegression(
                    class_weight="balanced",
                    max_iter=1000,
                    C=15.0,
                    random_state=42,
                ),
            ),
        ]
    )


def train_and_save_model(model_path: Path = MODEL_FILE) -> Pipeline:
    """Train the priority classifier on the balanced dataset and save to disk."""
    print(f"Training ML model with {len(DATASET)} balanced samples...")

    texts = [
        format_email_text(item.get("sender"), item.get("subject"), item.get("body"))
        for item in DATASET
    ]
    labels = [item["label"] for item in DATASET]

    pipeline = build_pipeline()
    pipeline.fit(texts, labels)

    # Ensure parent directory exists
    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, model_path)
    print(f"Model successfully saved to: {model_path}")

    global _cached_model
    _cached_model = pipeline
    return pipeline


def load_model(model_path: Path = MODEL_FILE) -> Pipeline:
    """Load the trained model from disk or cache."""
    global _cached_model
    if _cached_model is not None:
        return _cached_model

    if not model_path.exists():
        print(f"Model file not found at {model_path}. Training a new model now...")
        return train_and_save_model(model_path)

    _cached_model = joblib.load(model_path)
    return _cached_model


def explain_prediction(model: Pipeline, text: str, priority: str, limit: int = 3) -> list[str]:
    """
    Return human-readable Explainable AI (XAI) reasons based on positive
    TF-IDF model feature weights contributing to the predicted priority class.
    """
    vectorizer = model.named_steps.get("tfidf")
    classifier = model.named_steps.get("clf")
    if vectorizer is None or classifier is None or not hasattr(classifier, "coef_"):
        return ["Model signal: text matched trained priority distribution"]

    vector = vectorizer.transform([text])
    feature_names = vectorizer.get_feature_names_out()
    class_index = list(classifier.classes_).index(priority)
    contributions = vector.multiply(classifier.coef_[class_index]).toarray()[0]
    ranked = np.argsort(contributions)[::-1]

    # Meaningful domain signals linked directly to vocabulary features
    domain_rules = [
        ("urgent|critical|emergency|immediately|action required|asap|alert|warning", "Urgent language detected"),
        ("deadline|due|expires|tomorrow|today|by friday|tonight|overdue", "Deadline-related content detected"),
        ("meeting|interview|calendar|invite|schedule|appointment|zoom|sync", "Meeting or scheduling context detected"),
        ("bank|payment|invoice|transaction|billing|account|card|fraud|salary", "Financial or account context detected"),
        ("job|recruit|hiring|career|offer|interview|resume|application", "Work or recruitment opportunity detected"),
        ("sale|discount|coupon|newsletter|unsubscribe|promotion|deals|store|offer", "Promotional or newsletter language detected"),
        ("sprint|jira|github|pull request|deploy|code|review|backlog|feature", "Work collaboration context detected"),
    ]

    reasons = []
    top_terms = []
    for index in ranked:
        if contributions[index] <= 0:
            break
        feature = str(feature_names[index])
        top_terms.append(feature)

        for pattern, label in domain_rules:
            if any(term in feature for term in pattern.split("|")) and label not in reasons:
                reasons.append(label)
                break
        if len(reasons) >= limit:
            break

    # If domain rules yielded fewer than limit, include specific top model feature weights
    if len(reasons) < limit and top_terms:
        unique_terms = [t for t in top_terms if not any(t in r.lower() for r in reasons)][:3]
        if unique_terms:
            reasons.append(f"Model signals: positive weighting from terms '{', '.join(unique_terms)}'")

    if not reasons:
        reasons.append("Model signal: message context matched trained priority classification pattern")

    return reasons[:limit]


def predict_priority(sender: str = "", subject: str = "", body: str = "") -> dict:
    """
    Predict email priority and confidence.
    
    Returns:
        dict: {"priority": "HIGH" | "MEDIUM" | "LOW", "confidence": float, "reasons": list[str]}
    """
    model = load_model()
    text = format_email_text(sender, subject, body)

    # Predict class
    prediction = str(model.predict([text])[0])

    # Predict calibrated probability
    probabilities = model.predict_proba([text])[0]
    raw_max_prob = float(max(probabilities))

    # Scale 3-class probability range [0.33, 1.00] to intuitive confidence [0.50, 0.98]
    scaled_confidence = 0.50 + (raw_max_prob - 0.3333) / (1.0 - 0.3333) * 0.48
    confidence = float(round(max(0.50, min(0.98, scaled_confidence)), 2))

    return {
        "priority": prediction,
        "confidence": confidence,
        "reasons": explain_prediction(model, text, prediction),
    }


def predict_priority_batch(emails: list) -> list:
    """
    Batch predict email priorities and confidence scores using vectorized model inference.
    
    Args:
        emails: list of dicts with keys 'sender', 'subject', 'body'
        
    Returns:
        list of dicts: [{"priority": "HIGH" | "MEDIUM" | "LOW", "confidence": float, "reasons": list[str]}, ...]
    """
    if not emails:
        return []

    model = load_model()
    texts = [
        format_email_text(
            item.get("sender", ""),
            item.get("subject", ""),
            item.get("body", "")
        )
        for item in emails
    ]

    # Vectorized batch prediction (1 single vectorization + inference call)
    predictions = model.predict(texts)
    probabilities = model.predict_proba(texts)

    results = []
    for text_item, pred, probs in zip(texts, predictions, probabilities):
        raw_max_prob = float(max(probs))
        scaled_confidence = 0.50 + (raw_max_prob - 0.3333) / (1.0 - 0.3333) * 0.48
        confidence = float(round(max(0.50, min(0.98, scaled_confidence)), 2))
        results.append({
            "priority": str(pred),
            "confidence": confidence,
            "reasons": explain_prediction(model, text_item, str(pred)),
        })

    return results


if __name__ == "__main__":
    trained_model = train_and_save_model()
    print("Classes in model:", trained_model.classes_)

    test_samples = [
        (
            "security@bank.com",
            "Urgent: Account locked due to suspicious activity",
            "Please verify your credentials immediately to avoid permanent suspension.",
        ),
        (
            "pm@company.com",
            "Sprint 25 planning notes and tickets update",
            "Please review the backlog and update your assigned tasks before standup.",
        ),
        (
            "promo@store.com",
            "50% discount on all items this weekend!",
            "Unsubscribe here to stop receiving marketing newsletters.",
        ),
    ]

    print("\n--- Test Inferences ---")
    for s, sub, b in test_samples:
        result = predict_priority(s, sub, b)
        print(f"Subject: '{sub}' -> Result: {result}")
