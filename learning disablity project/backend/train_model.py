import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

# Set random seed for reproducibility
np.random.seed(42)

print("=" * 60)
print("TRAINING MULTI-FEATURE LEARNING DISABILITY DETECTION MODEL")
print("=" * 60)

# ========================================
# STEP 1: CREATE SYNTHETIC DATASET
# ========================================
print("\n[STEP 1] Generating synthetic dataset...")

n_samples = 2000

# Base feature distributions
reading_accuracy = np.clip(np.random.normal(80, 10, n_samples), 0, 100)
reading_wpm = np.clip(np.random.normal(120, 30, n_samples), 10, 300)
reading_delay_pct = np.clip(np.random.normal(20, 15, n_samples), 0, 250)
fluency_score = np.clip(np.random.normal(80, 10, n_samples), 0, 100)
pronunciation_score = np.clip(np.random.normal(80, 10, n_samples), 0, 100)

writing_accuracy = np.clip(np.random.normal(80, 10, n_samples), 0, 100)
handwriting_clarity = np.clip(np.random.normal(75, 12, n_samples), 0, 100)

math_accuracy = np.clip(np.random.normal(80, 10, n_samples), 0, 100)
puzzle_accuracy = np.clip(np.random.normal(80, 10, n_samples), 0, 100)

# Create DataFrame
df = pd.DataFrame({
    'reading_accuracy': reading_accuracy,
    'reading_wpm': reading_wpm,
    'reading_delay_pct': reading_delay_pct,
    'fluency_score': fluency_score,
    'pronunciation_score': pronunciation_score,
    'writing_accuracy': writing_accuracy,
    'handwriting_clarity': handwriting_clarity,
    'math_accuracy': math_accuracy,
    'puzzle_accuracy': puzzle_accuracy
})

# ========================================
# STEP 2: CREATE LABELS based on clinical profiles & severe triggers
# ========================================
print("\n[STEP 2] Simulating disability profile labeling...")

labels = np.zeros(n_samples, dtype=int)

# Inject positive samples for balanced classes:
# Class 1 (Dyslexia)
indices_1 = np.arange(0, 250)
df.loc[indices_1, 'reading_accuracy'] = np.random.uniform(20, 50, 250)
df.loc[indices_1, 'reading_wpm'] = np.random.uniform(20, 60, 250)
df.loc[indices_1, 'reading_delay_pct'] = np.random.uniform(60, 150, 250)
df.loc[indices_1, 'fluency_score'] = np.random.uniform(15, 45, 250)
df.loc[indices_1, 'pronunciation_score'] = np.random.uniform(20, 55, 250)
for col in ['writing_accuracy', 'handwriting_clarity', 'math_accuracy', 'puzzle_accuracy']:
    df.loc[indices_1, col] = np.random.uniform(70, 95, 250)
    
# Class 2 (Dysgraphia)
indices_2 = np.arange(250, 500)
df.loc[indices_2, 'writing_accuracy'] = np.random.uniform(20, 50, 250)
df.loc[indices_2, 'handwriting_clarity'] = np.random.uniform(10, 40, 250)
for col in ['reading_accuracy', 'reading_wpm', 'reading_delay_pct', 'fluency_score', 'pronunciation_score', 'math_accuracy', 'puzzle_accuracy']:
    if col == 'reading_delay_pct':
        df.loc[indices_2, col] = np.random.uniform(5, 25, 250)
    elif col == 'reading_wpm':
        df.loc[indices_2, col] = np.random.uniform(100, 160, 250)
    else:
        df.loc[indices_2, col] = np.random.uniform(70, 95, 250)
        
# Class 3 (Dyscalculia)
indices_3 = np.arange(500, 750)
df.loc[indices_3, 'math_accuracy'] = np.random.uniform(20, 50, 250)
for col in ['reading_accuracy', 'reading_wpm', 'reading_delay_pct', 'fluency_score', 'pronunciation_score', 'writing_accuracy', 'handwriting_clarity', 'puzzle_accuracy']:
    if col == 'reading_delay_pct':
        df.loc[indices_3, col] = np.random.uniform(5, 25, 250)
    elif col == 'reading_wpm':
        df.loc[indices_3, col] = np.random.uniform(100, 160, 250)
    else:
        df.loc[indices_3, col] = np.random.uniform(70, 95, 250)
        
# Class 4 (ADHD)
indices_4 = np.arange(750, 1000)
df.loc[indices_4, 'puzzle_accuracy'] = np.random.uniform(20, 50, 250)
for col in ['reading_accuracy', 'reading_wpm', 'reading_delay_pct', 'fluency_score', 'pronunciation_score', 'writing_accuracy', 'handwriting_clarity', 'math_accuracy']:
    if col == 'reading_delay_pct':
        df.loc[indices_4, col] = np.random.uniform(5, 25, 250)
    elif col == 'reading_wpm':
        df.loc[indices_4, col] = np.random.uniform(100, 160, 250)
    else:
        df.loc[indices_4, col] = np.random.uniform(70, 95, 250)
        
# Class 5 (High Risk / Severe Difficulty)
indices_5 = np.arange(1000, 1250)
df.loc[indices_5, 'reading_accuracy'] = np.random.uniform(20, 50, 250)
df.loc[indices_5, 'reading_wpm'] = np.random.uniform(20, 60, 250)
df.loc[indices_5, 'reading_delay_pct'] = np.random.uniform(60, 150, 250)
df.loc[indices_5, 'fluency_score'] = np.random.uniform(15, 45, 250)
df.loc[indices_5, 'pronunciation_score'] = np.random.uniform(20, 55, 250)
df.loc[indices_5, 'writing_accuracy'] = np.random.uniform(20, 50, 250)
df.loc[indices_5, 'handwriting_clarity'] = np.random.uniform(10, 40, 250)
df.loc[indices_5, 'math_accuracy'] = np.random.uniform(20, 50, 250)
df.loc[indices_5, 'puzzle_accuracy'] = np.random.uniform(40, 80, 250)

# Apply labeling logic based on rules
for i in range(n_samples):
    row = df.iloc[i]
    impaired_count = 0
    if row['reading_accuracy'] < 60: impaired_count += 1
    if row['writing_accuracy'] < 60 or row['handwriting_clarity'] < 45: impaired_count += 1
    if row['math_accuracy'] < 60: impaired_count += 1
    if row['puzzle_accuracy'] < 60: impaired_count += 1
    
    if impaired_count >= 3:
        labels[i] = 5
    elif row['reading_accuracy'] < 60:
        labels[i] = 1
    elif row['writing_accuracy'] < 60 or row['handwriting_clarity'] < 45:
        labels[i] = 2
    elif row['math_accuracy'] < 60:
        labels[i] = 3
    elif row['puzzle_accuracy'] < 60:
        labels[i] = 4
    else:
        labels[i] = 0
        
df['label'] = labels

label_map = {
    0: 'No Learning Disability Detected',
    1: 'Dyslexia',
    2: 'Dysgraphia',
    3: 'Dyscalculia',
    4: 'ADHD',
    5: 'High Risk / Severe Difficulty'
}

print("Label Distribution:")
for label, name in label_map.items():
    count = (labels == label).sum()
    percentage = (count / n_samples) * 100
    print(f"  {name}: {count} samples ({percentage:.1f}%)")

# ========================================
# STEP 3: PREPARE AND SPLIT DATA
# ========================================
feature_columns = [
    'reading_accuracy', 'reading_wpm', 'reading_delay_pct',
    'fluency_score', 'pronunciation_score',
    'writing_accuracy', 'handwriting_clarity',
    'math_accuracy', 'puzzle_accuracy'
]

X = df[feature_columns]
y = df['label']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# ========================================
# STEP 4: TRAIN RANDOM FOREST CLASSIFIER
# ========================================
print("\n[STEP 4] Training RandomForestClassifier...")
model = RandomForestClassifier(
    n_estimators=150,
    max_depth=12,
    min_samples_split=4,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1
)
model.fit(X_train, y_train)

train_acc = accuracy_score(y_train, model.predict(X_train))
test_acc = accuracy_score(y_test, model.predict(X_test))
print(f"✓ Training Accuracy: {train_acc*100:.2f}%")
print(f"✓ Test Accuracy:     {test_acc*100:.2f}%")

print("\n📋 Classification Report:")
print(classification_report(y_test, model.predict(X_test), target_names=list(label_map.values())))

# ========================================
# STEP 5: SAVE MODEL
# ========================================
print("\n[STEP 5] Saving model...")
model_dir = os.path.join(os.path.dirname(__file__), 'models')
os.makedirs(model_dir, exist_ok=True)
model_path = os.path.join(model_dir, 'model.pkl')

model_package = {
    'model': model,
    'features': feature_columns,
    'label_map': label_map
}
joblib.dump(model_package, model_path)
print(f"✓ Saved to: {model_path}")

# Save training CSV
dataset_path = os.path.join(os.path.dirname(__file__), 'data', 'training_dataset.csv')
os.makedirs(os.path.dirname(dataset_path), exist_ok=True)
df.to_csv(dataset_path, index=False)
print("✓ Saved dataset to CSV.")
