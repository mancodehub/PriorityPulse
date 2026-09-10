import json
import os
import sys
import re
import joblib
import numpy as np

def load_classifier():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(base_dir, 'model', 'classifier.joblib')
    if not os.path.exists(model_path):
        raise FileNotFoundError(f'Model not found at {model_path}. Run train_model.py first.')
    return joblib.load(model_path)

def generate_reasons(priority, text, confidence_pct):
    text_lower = text.lower()
    reasons = []
    
    if priority == 'HIGH':
        urgent_keywords = ['urgent', 'critical', 'immediately', 'deadline', 'emergency', 'asap', 'outage', 'action required']
        security_keywords = ['security', 'password', 'unauthorized', 'breach', 'payment failed', 'cancelled', 'lock']
        
        found_urgent = [w for w in urgent_keywords if w in text_lower]
        found_sec = [w for w in security_keywords if w in text_lower]
        
        if found_urgent:
            cues = ', '.join(found_urgent[:3])
            reasons.append(f'Urgent action indicators detected: {cues}.')
        elif found_sec:
            cues = ', '.join(found_sec[:2])
            reasons.append(f'Security or account alert detected: {cues}.')
        else:
            reasons.append('Subject and content demand immediate attention.')
            
        reasons.append(f'Classified as HIGH priority with {confidence_pct}% model confidence.')
        reasons.append('Prompt response or escalation recommended.')
        
    elif priority == 'LOW':
        promo_keywords = ['off', 'discount', 'sale', 'deal', 'coupon', 'newsletter', 'digest', 'weekly', 'promo', 'free']
        social_keywords = ['invited you', 'new followers', 'searches this week', 'playlist', 'highlights', 'streak']
        
        found_promo = [w for w in promo_keywords if re.search(r'\b' + re.escape(w) + r'\b', text_lower)]
        found_social = [w for w in social_keywords if w in text_lower]
        
        if found_promo:
            cues = ', '.join(found_promo[:3])
            reasons.append(f'Promotional or newsletter signals detected: {cues}.')
        elif found_social:
            reasons.append('Social or platform broadcast message detected.')
        else:
            reasons.append('Informational bulletin with no required user response.')
            
        reasons.append(f'Classified as LOW priority with {confidence_pct}% model confidence.')
        reasons.append('Safe for later review without blocking workflow.')
        
    else:
        work_keywords = ['meeting', 'sync', 'sprint', 'update', 'notes', 'agenda', 'review', 'jira', 'schedule', 'invoice']
        found_work = [w for w in work_keywords if w in text_lower]
        
        if found_work:
            cues = ', '.join(found_work[:3])
            reasons.append(f'Routine collaboration keywords identified: {cues}.')
        else:
            reasons.append('Standard work communication without emergency escalation.')
            
        reasons.append(f'Classified as MEDIUM priority with {confidence_pct}% model confidence.')
        reasons.append('Follow up as part of regular daily inbox flow.')
        
    return reasons[:3]

def predict_emails(emails_data):
    pipeline = load_classifier()
    classes = list(pipeline.classes_)
    
    is_single = False
    if isinstance(emails_data, dict):
        emails = [emails_data]
        is_single = True
    elif isinstance(emails_data, list):
        emails = emails_data
    else:
        raise ValueError('Expected JSON list or dict of email data')
        
    texts = []
    for item in emails:
        sender = item.get('sender', '') or ''
        subject = item.get('subject', '') or ''
        body = item.get('body', '') or item.get('preview', '') or ''
        text = f'Subject: {subject} Sender: {sender} Body: {body}'
        texts.append(text)
        
    if not texts:
        return []
        
    probs = pipeline.predict_proba(texts)
    
    results = []
    for i, proba in enumerate(probs):
        best_idx = int(np.argmax(proba))
        predicted_class = str(classes[best_idx])
        confidence_val = float(proba[best_idx])
        # Calibrate confidence in 3-class setting (baseline 0.33) to 60-98%
        calibrated_confidence = int(round(min(98, max(58, ((confidence_val - 0.33) / 0.67) * 40 + 58))))
        confidence_pct = calibrated_confidence
        
        reasons = generate_reasons(predicted_class, texts[i], confidence_pct)
        
        res = {
            'priority': predicted_class,
            'confidence': confidence_pct,
            'confidence_score': round(confidence_val, 4),
            'important': (predicted_class == 'HIGH'),
            'reasons': reasons
        }
        
        if 'id' in emails[i]:
            res['id'] = emails[i]['id']
            
        results.append(res)
        
    return results[0] if is_single else results

def main():
    raw_input = None
    if len(sys.argv) > 1:
        raw_input = sys.argv[1]
    else:
        raw_input = sys.stdin.read()
        
    if not raw_input or not raw_input.strip():
        print(json.dumps({'error': 'No input provided'}))
        sys.exit(1)
        
    try:
        data = json.loads(raw_input)
        predictions = predict_emails(data)
        print(json.dumps(predictions))
        sys.stdout.flush()
        sys.exit(0)
    except Exception as e:
        sys.stderr.write(f'Prediction error: {str(e)}\n')
        print(json.dumps({'error': str(e)}))
        sys.stdout.flush()
        sys.exit(1)

if __name__ == '__main__':
    main()
