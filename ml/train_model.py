import json
import os
import sys
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score
import joblib

def load_data(dataset_path):
    with open(dataset_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    texts = []
    labels = []
    for item in data:
        sender = item.get('sender', '')
        subject = item.get('subject', '')
        body = item.get('body', '')
        text = f'Subject: {subject} Sender: {sender} Body: {body}'
        texts.append(text)
        labels.append(item['label'].upper())
    
    return texts, labels

def train_and_save():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(base_dir, 'data', 'dataset.json')
    model_dir = os.path.join(base_dir, 'model')
    model_path = os.path.join(model_dir, 'classifier.joblib')
    
    os.makedirs(model_dir, exist_ok=True)
    
    print(f'Loading training data from {dataset_path}...')
    texts, labels = load_data(dataset_path)
    print(f'Total samples: {len(texts)}')
    
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(
            ngram_range=(1, 2),
            max_features=5000,
            sublinear_tf=True,
            stop_words='english'
        )),
        ('clf', LogisticRegression(
            class_weight='balanced',
            max_iter=1000,
            C=3.0,
            random_state=42
        ))
    ])
    
    print('Training LogisticRegression + TfidfVectorizer pipeline...')
    pipeline.fit(texts, labels)
    
    preds = pipeline.predict(texts)
    acc = accuracy_score(labels, preds)
    print(f'Training accuracy: {acc * 100:.1f}%')
    print('Classification report:')
    print(classification_report(labels, preds))
    
    joblib.dump(pipeline, model_path)
    print(f'Model successfully saved to {model_path}')

if __name__ == '__main__':
    train_and_save()
