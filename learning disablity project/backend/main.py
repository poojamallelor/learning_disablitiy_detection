"""
Flask Server for Learning Disability Detection
==============================================

Complete backend for AI-Based Learning Disability Detection System.
Implements all required endpoints for authentication, assessments, 
results analysis, and history tracking.

Endpoints:
  AUTH:
    POST /api/auth/register - Register new user
    POST /api/auth/login - User login
    POST /api/auth/logout - User logout
    
  STUDENTS:
    POST /api/students - Create new student
    GET /api/students - Get student list
    GET /api/students/<id> - Get student details
    
  ASSESSMENTS:
    POST /api/assessments/start - Start new assessment
    GET /api/assessments/<id> - Get assessment details
    
  TESTS:
    POST /api/tests/reading - Submit reading test
    POST /api/tests/writing - Submit writing test
    POST /api/tests/math - Submit math test
    POST /api/tests/puzzle - Submit puzzle test
    
  RESULTS:
    POST /api/results/analyze - Analyze and predict
    GET /api/results/<assessment_id> - Get results
    
  HISTORY:
    GET /api/history - Get user's assessment history
    GET /api/reports/<id> - Get past report

Usage:
  python main.py
  
The API will be available at: http://localhost:5000
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import os
from datetime import datetime, timedelta
from functools import wraps
import logging
import numpy as np
from typing import Dict, Any, Tuple, List
import json
import random
import joblib

# ========================================
# SETUP LOGGING
# ========================================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load trained RandomForest model package
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models', 'model.pkl')
model_package = None
if os.path.exists(MODEL_PATH):
    try:
        model_package = joblib.load(MODEL_PATH)
        logger.info("Successfully loaded RandomForest model for learning disability predictions!")
    except Exception as e:
        logger.error(f"Error loading RandomForest model package: {e}")
else:
    logger.warning("RandomForest model package (model.pkl) not found. Run train_model.py first.")

# ========================================
# INITIALIZE FLASK APP
# ========================================
app = Flask(__name__)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///learning_disability.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
app.config['JWT_EXPIRATION'] = 7 * 24 * 60 * 60  # 7 days

# ========================================
# CORS MIDDLEWARE
# ========================================
CORS(app)

# ========================================
# DATABASE INITIALIZATION
# ========================================
db = SQLAlchemy(app)

# ========================================
# DATABASE MODELS
# ========================================

class User(db.Model):
    """User model for authentication"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # parent, teacher
    full_name = db.Column(db.String(120), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    students = db.relationship('Student', backref='user', lazy=True, cascade='all, delete-orphan')
    assessments = db.relationship('Assessment', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'full_name': self.full_name,
            'created_at': self.created_at.isoformat()
        }


class Student(db.Model):
    """Student model"""
    __tablename__ = 'students'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    grade = db.Column(db.String(20), nullable=False)
    gender = db.Column(db.String(10), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    assessments = db.relationship('Assessment', backref='student', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'age': self.age,
            'grade': self.grade,
            'gender': self.gender,
            'created_at': self.created_at.isoformat()
        }


class Assessment(db.Model):
    """Assessment session"""
    __tablename__ = 'assessments'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    status = db.Column(db.String(20), default='started')  # started, completed
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)
    
    tests = db.relationship('TestResult', backref='assessment', lazy=True, cascade='all, delete-orphan')
    prediction = db.relationship('Prediction', backref='assessment', uselist=False, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'status': self.status,
            'started_at': self.started_at.isoformat(),
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }


class TestResult(db.Model):
    """Individual test results"""
    __tablename__ = 'test_results'
    
    id = db.Column(db.Integer, primary_key=True)
    assessment_id = db.Column(db.Integer, db.ForeignKey('assessments.id'), nullable=False)
    test_type = db.Column(db.String(20), nullable=False)  # reading, writing, math, puzzle
    score = db.Column(db.Float, nullable=False)
    time_taken = db.Column(db.Integer, nullable=True)  # seconds
    ideal_time = db.Column(db.Integer, nullable=True)  # seconds
    extra_time = db.Column(db.Integer, nullable=True)  # seconds
    accuracy = db.Column(db.Float, nullable=True)
    
    # Revamped Speech Reading metrics
    reading_accuracy = db.Column(db.Float, nullable=True)
    pronunciation_score = db.Column(db.Float, nullable=True)
    reading_wpm = db.Column(db.Float, nullable=True)
    actual_time = db.Column(db.Integer, nullable=True)
    delay_percentage = db.Column(db.Float, nullable=True)
    mispronounced_words = db.Column(db.Integer, nullable=True)
    skipped_words = db.Column(db.Integer, nullable=True)
    severity_score = db.Column(db.String(20), nullable=True)
    
    details = db.Column(db.JSON, nullable=True)  # Additional test-specific data
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'test_type': self.test_type,
            'score': self.score,
            'time_taken': self.time_taken,
            'ideal_time': self.ideal_time,
            'extra_time': self.extra_time,
            'accuracy': self.accuracy,
            'reading_accuracy': self.reading_accuracy,
            'pronunciation_score': self.pronunciation_score,
            'reading_wpm': self.reading_wpm,
            'actual_time': self.actual_time,
            'delay_percentage': self.delay_percentage,
            'mispronounced_words': self.mispronounced_words,
            'skipped_words': self.skipped_words,
            'severity_score': self.severity_score,
            'details': self.details,
            'completed_at': self.completed_at.isoformat()
        }


class Prediction(db.Model):
    """Final prediction/diagnosis"""
    __tablename__ = 'predictions'
    
    id = db.Column(db.Integer, primary_key=True)
    assessment_id = db.Column(db.Integer, db.ForeignKey('assessments.id'), nullable=False)
    predicted_disability = db.Column(db.String(50), nullable=False)
    severity_percentage = db.Column(db.Float, nullable=False)
    confidence_score = db.Column(db.Float, nullable=False)
    reading_indicator = db.Column(db.Float, nullable=True)
    writing_indicator = db.Column(db.Float, nullable=True)
    math_indicator = db.Column(db.Float, nullable=True)
    logic_indicator = db.Column(db.Float, nullable=True)
    reasoning = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        # Determine severity level from severity_percentage
        if self.predicted_disability in ["No Learning Disability", "No Learning Disability Detected"]:
            severity = "None"
        elif self.predicted_disability == "High Risk / Severe Difficulty":
            severity = "Severe"
        elif self.severity_percentage < 45:
            severity = "Mild"
        elif self.severity_percentage < 70:
            severity = "Moderate"
        else:
            severity = "Severe"
            
        features = {
            'reading_accuracy': self.reading_indicator or 0.0,
            'writing_accuracy': self.writing_indicator or 0.0,
            'math_accuracy': self.math_indicator or 0.0,
            'puzzle_accuracy': self.logic_indicator or 0.0
        }
        recs = DisabilityAnalyzer.get_recommendations(self.predicted_disability, severity, features)
        
        return {
            'id': self.id,
            'predicted_disability': self.predicted_disability,
            'severity_percentage': self.severity_percentage,
            'severity_level': severity,
            'confidence_score': self.confidence_score,
            'reading_indicator': self.reading_indicator,
            'writing_indicator': self.writing_indicator,
            'math_indicator': self.math_indicator,
            'logic_indicator': self.logic_indicator,
            'reasoning': self.reasoning,
            'recommendations': recs,
            'created_at': self.created_at.isoformat()
        }


# ========================================
# AUTHENTICATION HELPERS
# ========================================

def generate_token(user_id: int, expires_in: int = None) -> str:
    """Generate JWT token"""
    if expires_in is None:
        expires_in = app.config['JWT_EXPIRATION']
    
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(seconds=expires_in),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, app.config['JWT_SECRET_KEY'], algorithm='HS256')


def verify_token(token: str) -> Dict[str, Any]:
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def token_required(f):
    """Decorator to verify JWT token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            try:
                token = request.headers['Authorization'].split(' ')[1]
            except IndexError:
                return jsonify({'error': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        payload = verify_token(token)
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        user = User.query.get(payload['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 401
        
        return f(user, *args, **kwargs)
    return decorated


# ========================================
# ML ANALYSIS ENGINE
# ========================================

class DisabilityAnalyzer:
    """ML Analysis engine for detecting learning disabilities using a RandomForest model"""
    
    @staticmethod
    def get_recommendations(prediction: str, severity: str, features: Dict[str, float]) -> List[str]:
        recs = []
        if prediction == "Dyslexia":
            recs = [
                "Use multi-sensory reading techniques (combine sight, sound, and touch).",
                "Introduce audiobooks alongside printed texts to help associate sounds with words.",
                "Use large-font or high-contrast screen reading tools to reduce visual crowding.",
                "Provide extra reading time and support with phonological awareness training."
            ]
            if severity == "Severe":
                recs.append("Recommend consulting a specialized reading therapist for structured literacy intervention.")
        elif prediction == "Dysgraphia":
            recs = [
                "Provide a handwriting grip stabilizer or sensory pencil grips.",
                "Integrate speech-to-text tools or allow typing for longer essay answers.",
                "Use raised-line paper to assist the student with keeping text on the baseline.",
                "Encourage hand and finger muscle-strengthening exercises (like clay modeling or drawing)."
            ]
            if severity == "Severe":
                recs.append("Recommend consulting an occupational therapist to focus on fine motor coordination.")
        elif prediction == "Dyscalculia":
            recs = [
                "Use physical math manipulatives (blocks, beads, coins) to show concrete amounts.",
                "Provide visual grids and graph paper to keep numbers aligned in columns.",
                "Break multi-step math problems down into simple checklists with visual aids.",
                "Allow the use of calculators or arithmetic reference charts during exercises."
            ]
            if severity == "Severe":
                recs.append("Recommend educational therapy specializing in conceptual math support.")
        elif prediction == "ADHD":
            recs = [
                "Break tasks down into 10-15 minute blocks with brief physical movement breaks.",
                "Set up a quiet, minimal-distraction study environment with noise-canceling headphones.",
                "Use visual schedules, countdown timers, and checklist checklists to track progress.",
                "Use positive reinforcement systems (point charts, immediate feedback) to keep focus."
            ]
            if severity == "Severe":
                recs.append("Recommend medical or cognitive-behavioral consultation to support concentration.")
        elif prediction == "High Risk / Severe Difficulty":
            recs = [
                "Schedule a comprehensive clinical assessment with an educational psychologist.",
                "Implement a multi-sensory, structured learning curriculum across all subjects.",
                "Provide classroom accommodations such as extra time, oral testing, and assistive technologies.",
                "Coordinate between parents, teachers, and specialists to develop an Individualized Education Program (IEP)."
            ]
        else:
            recs = [
                "Keep up regular reading and problem-solving exercises to maintain balanced skills.",
                "Incorporate interactive games and visual puzzles to stimulate cognitive reasoning.",
                "Ensure a healthy balance of screen time, physical play, and study intervals."
            ]
        return recs

    @staticmethod
    def generate_reasoning(prediction: str, severity: str, features: Dict[str, float]) -> str:
        if prediction == "Dyslexia":
            return f"Student shows indicators matching dyslexia with a reading accuracy of {features.get('reading_accuracy', 0.0):.1f}%, a reading speed of {features.get('reading_wpm', 0.0):.1f} WPM, and a reading time delay of {features.get('reading_delay_pct', 0.0):.1f}% compared to peer averages. The predicted severity is {severity}."
        elif prediction == "Dysgraphia":
            return f"Student shows indicators matching dysgraphia with a spelling accuracy of {features.get('writing_accuracy', 0.0):.1f}% and handwriting clarity rating of {features.get('handwriting_clarity', 0.0):.1f}% on the drawing canvas. The predicted severity is {severity}."
        elif prediction == "Dyscalculia":
            return f"Student shows indicators matching dyscalculia. The student achieved {features.get('math_accuracy', 0.0):.1f}% accuracy on math problems. The predicted severity is {severity}."
        elif prediction == "ADHD":
            return f"Student shows indicators matching ADHD. The student achieved {features.get('puzzle_accuracy', 0.0):.1f}% accuracy on logic puzzles. The predicted severity is {severity}."
        elif prediction == "High Risk / Severe Difficulty":
            return f"Student shows severe indicators across multiple cognitive modules: reading accuracy ({features.get('reading_accuracy', 0.0):.1f}%), writing accuracy ({features.get('writing_accuracy', 0.0):.1f}%), math accuracy ({features.get('math_accuracy', 0.0):.1f}%), and puzzle accuracy ({features.get('puzzle_accuracy', 0.0):.1f}%). The predicted overall severity is {severity}."
        else:
            return "Student demonstrates healthy cognitive and academic skill sets. Performance scores across reading, writing, mathematics, and logic fall well within normal age-matched thresholds."

    @staticmethod
    def analyze(features: Dict[str, float]) -> Dict[str, Any]:
        """
        Analyze test results and predict learning disability using RandomForest model
        """
        feature_keys = [
            'reading_accuracy', 'reading_wpm', 'reading_delay_pct',
            'fluency_score', 'pronunciation_score',
            'writing_accuracy', 'handwriting_clarity',
            'math_accuracy', 'puzzle_accuracy'
        ]
        
        # Fill missing features with 0.0 (no fallback scores)
        input_data = [features.get(feat, 0.0) for feat in feature_keys]
        
        # LOG every feature passed to model (Task 16)
        logger.info(f"ML Features passed to model: {features}")
        
        if model_package is not None:
            model = model_package['model']
            label_map = model_package['label_map']
            
            # Predict class probabilities
            input_arr = np.array([input_data])
            probs = model.predict_proba(input_arr)[0]
            pred_class = model.predict(input_arr)[0]
            
            prediction = label_map[pred_class]
            probability = float(probs[pred_class]) * 100
            
            # LOG prediction probabilities (Task 16)
            prob_log = {label_map[i]: float(probs[i])*100 for i in range(len(probs))}
            logger.info(f"ML Prediction probabilities: {prob_log}")
            logger.info(f"Predicted class: {prediction} ({probability:.2f}% confidence)")
            
            if pred_class == 0:
                severity = "None"
            elif pred_class == 5:
                severity = "Severe"
            else:
                if probability < 45:
                    severity = "Mild"
                elif probability < 70:
                    severity = "Moderate"
                else:
                    severity = "Severe"
        else:
            # Fallback rule-based logic if model file not found
            logger.info("ML model not loaded. Using fallback rule-based analysis...")
            
            impaired_count = 0
            if features.get('reading_accuracy', 0.0) < 60: impaired_count += 1
            if features.get('writing_accuracy', 0.0) < 60 or features.get('handwriting_clarity', 0.0) < 45: impaired_count += 1
            if features.get('math_accuracy', 0.0) < 60: impaired_count += 1
            if features.get('puzzle_accuracy', 0.0) < 60: impaired_count += 1
            
            if impaired_count >= 3:
                prediction = "High Risk / Severe Difficulty"
                severity = "Severe"
            elif features.get('reading_accuracy', 0.0) < 60:
                prediction = "Dyslexia"
                severity = "Moderate"
            elif features.get('writing_accuracy', 0.0) < 60 or features.get('handwriting_clarity', 0.0) < 45:
                prediction = "Dysgraphia"
                severity = "Moderate"
            elif features.get('math_accuracy', 0.0) < 60:
                prediction = "Dyscalculia"
                severity = "Moderate"
            elif features.get('puzzle_accuracy', 0.0) < 60:
                prediction = "ADHD"
                severity = "Moderate"
            else:
                prediction = "No Learning Disability Detected"
                severity = "None"
                
            probability = 100.0
            
        recommendations = DisabilityAnalyzer.get_recommendations(prediction, severity, features)
        reasoning = DisabilityAnalyzer.generate_reasoning(prediction, severity, features)
        
        return {
            'predicted_disability': prediction,
            'severity_percentage': probability,
            'severity_level': severity,
            'confidence_score': probability / 100.0,
            'reading_indicator': features.get('reading_accuracy', 0.0),
            'writing_indicator': features.get('writing_accuracy', 0.0),
            'math_indicator': features.get('math_accuracy', 0.0),
            'logic_indicator': features.get('puzzle_accuracy', 0.0),
            'reasoning': reasoning,
            'recommendations': recommendations
        }


# ========================================
# API ENDPOINTS
# ========================================

# --------- HEALTH CHECK ---------
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'API is running'}), 200


# --------- AUTHENTICATION ---------
@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register new user"""
    data = request.get_json()
    
    if not data or not all(k in data for k in ['username', 'email', 'password', 'role', 'full_name']):
        return jsonify({'error': 'Missing required fields'}), 400
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 409
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 409
    
    if data['role'] not in ['parent', 'teacher']:
        return jsonify({'error': 'Invalid role. Must be "parent" or "teacher"'}), 400
    
    user = User(
        username=data['username'],
        email=data['email'],
        role=data['role'],
        full_name=data['full_name']
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    token = generate_token(user.id)
    
    return jsonify({
        'message': 'User registered successfully',
        'token': token,
        'user': user.to_dict()
    }), 201


@app.route('/api/auth/login', methods=['POST'])
def login():
    """User login"""
    data = request.get_json()
    
    if not data or not all(k in data for k in ['username', 'password']):
        return jsonify({'error': 'Missing username or password'}), 400
    
    user = User.query.filter_by(username=data['username']).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid username or password'}), 401
    
    token = generate_token(user.id)
    
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': user.to_dict()
    }), 200


@app.route('/api/auth/google-login', methods=['POST'])
def google_login():
    """Mock Google Login: signs in/up user using Google email and name"""
    data = request.get_json()
    
    if not data or not all(k in data for k in ['email', 'full_name']):
        return jsonify({'error': 'Missing required fields: email and full_name'}), 400
    
    email = data['email']
    full_name = data['full_name']
    
    # Check if user with this email already exists
    user = User.query.filter_by(email=email).first()
    
    if not user:
        # Create user automatically
        username = email.split('@')[0]
        # Ensure username is unique
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            username = f"{username}_{int(datetime.utcnow().timestamp())}"
            
        user = User(
            username=username,
            email=email,
            role='parent',  # Default to parent role to access assessment features
            full_name=full_name
        )
        # Set a random password for Google-authenticated users
        user.set_password(os.urandom(16).hex())
        
        db.session.add(user)
        db.session.commit()
        logger.info(f"Automatically registered user: {email}")
    else:
        logger.info(f"Logged in existing user: {email}")
        
    token = generate_token(user.id)
    
    return jsonify({
        'message': 'Google Login successful',
        'token': token,
        'user': user.to_dict()
    }), 200



# --------- STUDENTS ---------
@app.route('/api/students', methods=['POST'])
@token_required
def create_student(current_user):
    """Create new student"""
    data = request.get_json()
    
    if not data or not all(k in data for k in ['name', 'age', 'grade']):
        return jsonify({'error': 'Missing required fields'}), 400
    
    student = Student(
        user_id=current_user.id,
        name=data['name'],
        age=data['age'],
        grade=data['grade'],
        gender=data.get('gender', '')
    )
    
    db.session.add(student)
    db.session.commit()
    
    return jsonify({
        'message': 'Student created successfully',
        'student': student.to_dict()
    }), 201


@app.route('/api/students', methods=['GET'])
@token_required
def get_students(current_user):
    """Get all students for current user"""
    students = Student.query.filter_by(user_id=current_user.id).all()
    
    return jsonify({
        'students': [s.to_dict() for s in students]
    }), 200


@app.route('/api/students/<int:student_id>', methods=['GET'])
@token_required
def get_student(current_user, student_id):
    """Get specific student"""
    student = Student.query.filter_by(id=student_id, user_id=current_user.id).first()
    
    if not student:
        return jsonify({'error': 'Student not found'}), 404
    
    return jsonify({'student': student.to_dict()}), 200


# --------- ASSESSMENTS ---------
@app.route('/api/assessments/start', methods=['POST'])
@token_required
def start_assessment(current_user):
    """Start new assessment"""
    data = request.get_json()
    
    if not data or 'student_id' not in data:
        return jsonify({'error': 'Missing student_id'}), 400
    
    student = Student.query.filter_by(id=data['student_id'], user_id=current_user.id).first()
    
    if not student:
        return jsonify({'error': 'Student not found'}), 404
    
    assessment = Assessment(
        user_id=current_user.id,
        student_id=student.id,
        status='started'
    )
    
    db.session.add(assessment)
    db.session.commit()
    
    return jsonify({
        'message': 'Assessment started',
        'assessment': assessment.to_dict()
    }), 201


@app.route('/api/assessments/<int:assessment_id>', methods=['GET'])
@token_required
def get_assessment(current_user, assessment_id):
    """Get assessment details"""
    assessment = Assessment.query.filter_by(id=assessment_id, user_id=current_user.id).first()
    
    if not assessment:
        return jsonify({'error': 'Assessment not found'}), 404
    
    return jsonify({'assessment': assessment.to_dict()}), 200


# --------- TEST RESULTS ---------
@app.route('/api/tests/reading', methods=['POST'])
@token_required
def submit_reading_test(current_user):
    """Submit reading test results and perform speech analysis"""
    import base64
    import difflib
    
    data = request.get_json()
    if not data or not all(k in data for k in ['assessment_id', 'original_text', 'spoken_text']):
        return jsonify({'error': 'Missing required fields'}), 400
        
    assessment_id = data['assessment_id']
    original_text = data['original_text']
    spoken_text = data['spoken_text']
    actual_time = data.get('actual_time') # Can be None or missing (Task 9)
    audio_base64 = data.get('audio_base64')
    
    assessment = Assessment.query.filter_by(id=assessment_id, user_id=current_user.id).first()
    if not assessment:
        return jsonify({'error': 'Assessment not found'}), 404
        
    student = Student.query.get(assessment.student_id)
    if not student:
        return jsonify({'error': 'Student not found'}), 404
        
    age = student.age
    
    # 1. Expected WPM based on age
    if age <= 6:
        expected_wpm = 50
    elif age <= 8:
        expected_wpm = 80
    elif age <= 10:
        expected_wpm = 110
    else:
        expected_wpm = 130
        
    # Clean original and spoken words
    words_orig = [w.strip(".,!?\"()").lower() for w in original_text.split() if w.strip(".,!?\"()")]
    words_spoken = [w.strip(".,!?\"()").lower() for w in spoken_text.split() if w.strip(".,!?\"()")]
    word_count = len(words_orig)
    
    # 2. Calculate ideal time
    ideal_time = max(15, int((word_count / expected_wpm) * 60))
    
    correct_count = 0
    skipped_count = 0
    extra_count = 0
    substituted_count = 0
    mispronounced_count = 0
    
    # Check if microphone recording is empty or no speech is detected (Task 9)
    is_empty_audio = (not audio_base64 or len(audio_base64.strip()) == 0)
    is_no_speech = (not spoken_text or not spoken_text.strip() or len(words_spoken) == 0)
    
    if is_no_speech:
        accuracy = 0.0
        reading_wpm = 0.0
        fluency_score = 0.0
        pronunciation_score = 0.0
        skipped_count = word_count
        delay_percentage = 0.0
        deficit_percentage = 100.0
        severity_score = "Severe"
    else:
        # Align using SequenceMatcher
        matcher = difflib.SequenceMatcher(None, words_orig, words_spoken)
        for tag, i1, i2, j1, j2 in matcher.get_opcodes():
            if tag == 'equal':
                correct_count += (i2 - i1)
            elif tag == 'delete':
                skipped_count += (i2 - i1)
            elif tag == 'insert':
                extra_count += (j2 - j1)
            elif tag == 'replace':
                orig_sub = words_orig[i1:i2]
                spk_sub = words_spoken[j1:j2]
                min_len = min(len(orig_sub), len(spk_sub))
                
                for k in range(min_len):
                    # Spelling similarity to differentiate substituted vs mispronounced
                    sim = difflib.SequenceMatcher(None, orig_sub[k], spk_sub[k]).ratio()
                    if sim >= 0.6:
                        mispronounced_count += 1
                    else:
                        substituted_count += 1
                
                if len(orig_sub) > min_len:
                    skipped_count += (len(orig_sub) - min_len)
                if len(spk_sub) > min_len:
                    extra_count += (len(spk_sub) - min_len)

        # Ensure we have actual_time (Task 9)
        time_for_wpm = max(1, int(actual_time)) if actual_time is not None else 1
        accuracy = (correct_count / word_count) * 100.0 if word_count > 0 else 0.0
        reading_wpm = (len(words_spoken) / time_for_wpm) * 60.0
        
        delay_percentage = max(0.0, ((time_for_wpm - ideal_time) / ideal_time) * 100.0) if actual_time is not None else 0.0
        deficit_percentage = max(0.0, ((expected_wpm - reading_wpm) / expected_wpm) * 100.0) if reading_wpm < expected_wpm else 0.0
        pronunciation_score = max(0.0, 100.0 - (mispronounced_count / word_count) * 100.0) if word_count > 0 else 100.0
        
        # Fluency Score combining accuracy (60%) and speed/deficit (40%)
        fluency_score = (accuracy * 0.6) + (max(0.0, 100.0 - deficit_percentage) * 0.4)
        
        # 3. Reading Severity Score
        if accuracy >= 90.0 and deficit_percentage <= 15.0:
            severity_score = "None"
        elif accuracy < 60.0 or deficit_percentage > 50.0 or pronunciation_score < 60.0:
            severity_score = "Severe"
        elif accuracy < 80.0 or deficit_percentage > 30.0 or pronunciation_score < 80.0:
            severity_score = "Moderate"
        else:
            severity_score = "Mild"

    # LOG Reading score calculation (Task 16)
    logger.info(f"Reading score calculation details for student_id {student.id}, assessment_id {assessment.id}:")
    logger.info(f"  - Words: {word_count} expected, {len(words_spoken)} spoken")
    logger.info(f"  - Audio Empty: {is_empty_audio}, No Speech: {is_no_speech}")
    logger.info(f"  - Accuracy: {accuracy:.2f}%, WPM: {reading_wpm:.2f} (Expected WPM: {expected_wpm})")
    logger.info(f"  - Fluency: {fluency_score:.2f}%, Pronunciation: {pronunciation_score:.2f}%")
    logger.info(f"  - Reading Time: {actual_time}s (Ideal: {ideal_time}s)")
    logger.info(f"  - Severity: {severity_score}")
        
    # 4. Save raw audio if provided
    audio_path = None
    if audio_base64:
        try:
            # Check if format prefix is present (e.g. data:audio/wav;base64,)
            if ',' in audio_base64:
                audio_base64 = audio_base64.split(',')[1]
            audio_bytes = base64.b64decode(audio_base64)
            audio_dir = os.path.join(os.path.dirname(__file__), 'data', 'audio')
            os.makedirs(audio_dir, exist_ok=True)
            filename = f"assessment_{assessment.id}_reading.wav"
            file_full_path = os.path.join(audio_dir, filename)
            with open(file_full_path, 'wb') as f:
                f.write(audio_bytes)
            audio_path = f"data/audio/{filename}"
            logger.info(f"Saved reading audio to {file_full_path}")
        except Exception as e:
            logger.error(f"Error saving reading audio: {e}")
            
    time_val = int(actual_time) if actual_time is not None else 0
    extra_time = max(0, time_val - ideal_time)
    
    # Populate details JSON
    details_json = {
        'wpm': round(reading_wpm, 2),
        'expected_wpm': expected_wpm,
        'time_taken': time_val,
        'ideal_time': ideal_time,
        'delay_pct': round(delay_percentage, 2) if actual_time is not None else 0.0,
        'deficit_pct': round(deficit_percentage, 2),
        'pronunciation_score': round(pronunciation_score, 2),
        'fluency_score': round(fluency_score, 2),
        'skipped_words': skipped_count,
        'mispronounced_words': mispronounced_count,
        'extra_words': extra_count,
        'substituted_words': substituted_count,
        'severity_score': severity_score,
        'audio_path': audio_path,
        'spoken_transcript': spoken_text
    }
    
    # Store everything in TestResult
    result = TestResult(
        assessment_id=assessment.id,
        test_type='reading',
        score=round(accuracy, 2), # Score for ML predictions is accuracy
        time_taken=time_val if actual_time is not None else None, # Enforce missing (Task 9)
        ideal_time=ideal_time,
        extra_time=extra_time,
        accuracy=round(accuracy, 2),
        
        # New columns
        reading_accuracy=round(accuracy, 2),
        pronunciation_score=round(pronunciation_score, 2),
        reading_wpm=round(reading_wpm, 2),
        actual_time=time_val if actual_time is not None else None, # Enforce missing (Task 9)
        delay_percentage=round(delay_percentage, 2) if actual_time is not None else None,
        mispronounced_words=mispronounced_count,
        skipped_words=skipped_count,
        severity_score=severity_score,
        
        details=details_json
    )
    
    db.session.add(result)
    db.session.commit()
    
    return jsonify({
        'message': 'Reading test submitted successfully',
        'result': result.to_dict()
    }), 201


@app.route('/api/tests/writing', methods=['POST'])
@token_required
def submit_writing_test(current_user):
    """Submit writing test results"""
    data = request.get_json()
    
    if not data or 'assessment_id' not in data or 'score' not in data:
        return jsonify({'error': 'Missing required fields'}), 400
    
    assessment = Assessment.query.filter_by(
        id=data['assessment_id'],
        user_id=current_user.id
    ).first()
    
    if not assessment:
        return jsonify({'error': 'Assessment not found'}), 404
        
    score = float(data['score'])
    accuracy = float(data.get('accuracy', 0))
    details = data.get('details', {})
    
    # Check if input is blank or no handwriting detected (Task 10)
    written_words = details.get('written_words', [])
    is_blank = len(written_words) == 0 or all(w.get('clarity', 0) == 0 for w in written_words)
    
    if is_blank:
        score = 0.0
        accuracy = 0.0
        details['handwriting_clarity'] = 0.0
        logger.info(f"Writing test submitted is blank. Resetting scores to 0.0.")
        
    # LOG Writing score calculation (Task 16)
    logger.info(f"Writing score calculation details for student_id {assessment.student_id}, assessment_id {assessment.id}:")
    logger.info(f"  - Written Words: {len(written_words)}, Is Blank: {is_blank}")
    logger.info(f"  - Spelling Accuracy: {accuracy:.2f}%")
    logger.info(f"  - Handwriting Clarity: {details.get('handwriting_clarity', 0.0):.2f}%")
    logger.info(f"  - Final Combined Score: {score:.2f}%")
    
    result = TestResult(
        assessment_id=assessment.id,
        test_type='writing',
        score=round(score, 2),
        accuracy=round(accuracy, 2),
        details=details
    )
    
    db.session.add(result)
    db.session.commit()
    
    return jsonify({
        'message': 'Writing test submitted',
        'result': result.to_dict()
    }), 201


@app.route('/api/tests/math', methods=['POST'])
@token_required
def submit_math_test(current_user):
    """Submit math test results"""
    data = request.get_json()
    
    if not data or 'assessment_id' not in data or 'score' not in data:
        return jsonify({'error': 'Missing required fields'}), 400
    
    assessment = Assessment.query.filter_by(
        id=data['assessment_id'],
        user_id=current_user.id
    ).first()
    
    if not assessment:
        return jsonify({'error': 'Assessment not found'}), 404
        
    details = data.get('details', {})
    answers = details.get('answers', {})
    total_questions = details.get('total_questions', 5)
    correct_count = details.get('correct_answers', 0)
    
    # Calculate score only from actual answers, where wrong answers reduce score (Task 11)
    answered_count = len(answers)
    if answered_count == 0:
        score = 0.0
        accuracy = 0.0
    else:
        incorrect_count = answered_count - correct_count
        score = max(0.0, ((correct_count - incorrect_count) / answered_count) * 100.0)
        accuracy = (correct_count / answered_count) * 100.0
        
    # LOG Math score calculation (Task 16)
    logger.info(f"Math score calculation details for student_id {assessment.student_id}, assessment_id {assessment.id}:")
    logger.info(f"  - Answered: {answered_count} of {total_questions} questions")
    logger.info(f"  - Correct: {correct_count}, Incorrect: {answered_count - correct_count}")
    logger.info(f"  - Accuracy: {accuracy:.2f}%, Penalized Score: {score:.2f}%")
    
    result = TestResult(
        assessment_id=assessment.id,
        test_type='math',
        score=round(score, 2),
        accuracy=round(accuracy, 2),
        details=details
    )
    
    db.session.add(result)
    db.session.commit()
    
    return jsonify({
        'message': 'Math test submitted',
        'result': result.to_dict()
    }), 201


@app.route('/api/tests/puzzle', methods=['POST'])
@token_required
def submit_puzzle_test(current_user):
    """Submit puzzle/logic test results"""
    data = request.get_json()
    
    if not data or 'assessment_id' not in data or 'score' not in data:
        return jsonify({'error': 'Missing required fields'}), 400
    
    assessment = Assessment.query.filter_by(
        id=data['assessment_id'],
        user_id=current_user.id
    ).first()
    
    if not assessment:
        return jsonify({'error': 'Assessment not found'}), 404
        
    details = data.get('details', {})
    answers = details.get('answers', {})
    correct_count = details.get('correct_answers', 0)
    
    # Calculate score only from actual responses (Task 12)
    answered_count = len(answers)
    if answered_count == 0:
        score = 0.0
        accuracy = 0.0
    else:
        score = (correct_count / answered_count) * 100.0
        accuracy = (correct_count / answered_count) * 100.0
        
    # LOG Puzzle score calculation (Task 16)
    logger.info(f"Puzzle score calculation details for student_id {assessment.student_id}, assessment_id {assessment.id}:")
    logger.info(f"  - Answered: {answered_count} questions")
    logger.info(f"  - Correct: {correct_count}, Incorrect: {answered_count - correct_count}")
    logger.info(f"  - Accuracy & Score: {score:.2f}%")
    
    result = TestResult(
        assessment_id=assessment.id,
        test_type='puzzle',
        score=round(score, 2),
        accuracy=round(accuracy, 2),
        details=details
    )
    
    db.session.add(result)
    db.session.commit()
    
    return jsonify({
        'message': 'Puzzle test submitted',
        'result': result.to_dict()
    }), 201


# --------- RESULTS ANALYSIS ---------
@app.route('/api/results/analyze', methods=['POST'])
@token_required
def analyze_results(current_user):
    """Analyze all test results and generate prediction"""
    data = request.get_json()
    
    if not data or 'assessment_id' not in data:
        return jsonify({'error': 'Missing assessment_id'}), 400
    
    assessment = Assessment.query.filter_by(
        id=data['assessment_id'],
        user_id=current_user.id
    ).first()
    
    if not assessment:
        return jsonify({'error': 'Assessment not found'}), 404
    
    # Get all test results for this assessment
    tests = TestResult.query.filter_by(assessment_id=assessment.id).all()
    
    # Validation Rules (Task 14)
    test_types = [t.test_type for t in tests]
    required_types = {'reading', 'writing', 'math', 'puzzle'}
    
    reading_test = next((t for t in tests if t.test_type == 'reading'), None)
    
    is_incomplete = False
    if not required_types.issubset(set(test_types)):
        is_incomplete = True
    elif not reading_test or reading_test.actual_time is None or reading_test.actual_time <= 0:
        is_incomplete = True
        
    if is_incomplete:
        return jsonify({
            'error': 'Assessment Incomplete',
            'message': 'All assessment modules (reading, writing, math, puzzle) must be completed, and reading time must be recorded before generating a diagnosis.'
        }), 400
        
    # Extract 9 features for ML RandomForest engine (Task 13)
    # Reading
    reading_accuracy = reading_test.reading_accuracy if reading_test.reading_accuracy is not None else reading_test.score
    reading_wpm = reading_test.reading_wpm if reading_test.reading_wpm is not None else 0.0
    reading_delay_pct = reading_test.delay_percentage if reading_test.delay_percentage is not None else 0.0
    fluency_score = 0.0
    pronunciation_score = reading_test.pronunciation_score if reading_test.pronunciation_score is not None else 0.0
    if reading_test.details:
        fluency_score = reading_test.details.get('fluency_score', 0.0)
        
    # Writing
    writing_test = next((t for t in tests if t.test_type == 'writing'), None)
    writing_accuracy = 0.0
    handwriting_clarity = 0.0
    if writing_test:
        writing_accuracy = writing_test.accuracy if writing_test.accuracy is not None else writing_test.score
        if writing_test.details:
            handwriting_clarity = writing_test.details.get('handwriting_clarity', 0.0)
            
    # Math
    math_test = next((t for t in tests if t.test_type == 'math'), None)
    math_accuracy = 0.0
    if math_test:
        math_accuracy = math_test.accuracy if math_test.accuracy is not None else math_test.score
        
    # Puzzle
    puzzle_test = next((t for t in tests if t.test_type == 'puzzle'), None)
    puzzle_accuracy = 0.0
    if puzzle_test:
        puzzle_accuracy = puzzle_test.accuracy if puzzle_test.accuracy is not None else puzzle_test.score
        
    features = {
        'reading_accuracy': reading_accuracy,
        'reading_wpm': reading_wpm,
        'reading_delay_pct': reading_delay_pct,
        'fluency_score': fluency_score,
        'pronunciation_score': pronunciation_score,
        'writing_accuracy': writing_accuracy,
        'handwriting_clarity': handwriting_clarity,
        'math_accuracy': math_accuracy,
        'puzzle_accuracy': puzzle_accuracy
    }
    
    # Analyze using ML engine
    analysis_result = DisabilityAnalyzer.analyze(features)
    
    # Create prediction record
    prediction = Prediction(
        assessment_id=assessment.id,
        predicted_disability=analysis_result['predicted_disability'],
        severity_percentage=analysis_result['severity_percentage'],
        confidence_score=analysis_result['confidence_score'],
        reading_indicator=analysis_result['reading_indicator'],
        writing_indicator=analysis_result['writing_indicator'],
        math_indicator=analysis_result['math_indicator'],
        logic_indicator=analysis_result['logic_indicator'],
        reasoning=analysis_result['reasoning']
    )
    
    # Update assessment status
    assessment.status = 'completed'
    assessment.completed_at = datetime.utcnow()
    
    db.session.add(prediction)
    db.session.commit()
    
    return jsonify({
        'message': 'Analysis complete',
        'prediction': prediction.to_dict(),
        'test_results': [t.to_dict() for t in tests]
    }), 201


@app.route('/api/results/<int:assessment_id>', methods=['GET'])
@token_required
def get_results(current_user, assessment_id):
    """Get results for an assessment"""
    assessment = Assessment.query.filter_by(
        id=assessment_id,
        user_id=current_user.id
    ).first()
    
    if not assessment:
        return jsonify({'error': 'Assessment not found'}), 404
    
    tests = TestResult.query.filter_by(assessment_id=assessment.id).all()
    prediction = Prediction.query.filter_by(assessment_id=assessment.id).first()
    
    return jsonify({
        'assessment': assessment.to_dict(),
        'test_results': [t.to_dict() for t in tests],
        'prediction': prediction.to_dict() if prediction else None
    }), 200


# --------- HISTORY ---------
@app.route('/api/history', methods=['GET'])
@token_required
def get_history(current_user):
    """Get assessment history for current user"""
    assessments = Assessment.query.filter_by(user_id=current_user.id).all()
    
    history = []
    for assessment in assessments:
        student = Student.query.get(assessment.student_id)
        prediction = Prediction.query.filter_by(assessment_id=assessment.id).first()
        tests = TestResult.query.filter_by(assessment_id=assessment.id).all()
        test_scores = {t.test_type: t.score for t in tests}
        
        history.append({
            'assessment_id': assessment.id,
            'student_name': student.name if student else 'Unknown',
            'student_id': student.id if student else None,
            'completed_at': assessment.completed_at.isoformat() if assessment.completed_at else None,
            'status': assessment.status,
            'prediction': prediction.to_dict() if prediction else None,
            'test_scores': test_scores
        })
    
    return jsonify({'history': history}), 200


@app.route('/api/reports/<int:assessment_id>', methods=['GET'])
@token_required
def get_report(current_user, assessment_id):
    """Get detailed report for an assessment"""
    assessment = Assessment.query.filter_by(
        id=assessment_id,
        user_id=current_user.id
    ).first()
    
    if not assessment:
        return jsonify({'error': 'Report not found'}), 404
    
    student = Student.query.get(assessment.student_id)
    tests = TestResult.query.filter_by(assessment_id=assessment.id).all()
    prediction = Prediction.query.filter_by(assessment_id=assessment.id).first()
    
    return jsonify({
        'student': student.to_dict() if student else None,
        'assessment': assessment.to_dict(),
        'test_results': [t.to_dict() for t in tests],
        'prediction': prediction.to_dict() if prediction else None
    }), 200


# ========================================
# ERROR HANDLERS
# ========================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def server_error(error):
    db.session.rollback()
    logger.error(f'Server error: {error}')
    return jsonify({'error': 'Internal server error'}), 500


# ========================================
# RUN APPLICATION
# ========================================

@app.route('/api/auth/logout', methods=['POST'])
@token_required
def logout(current_user):
    """User logout"""
    return jsonify({'message': 'Logged out successfully'}), 200


# ========================================
# DATABASE EXPORT HELPERS
# ========================================

@app.route('/api/data/export', methods=['GET'])
@token_required
def export_data(current_user):
    """Export all user data"""
    students = Student.query.filter_by(user_id=current_user.id).all()
    assessments = Assessment.query.filter_by(user_id=current_user.id).all()
    
    export_data = {
        'user': current_user.to_dict(),
        'students': [s.to_dict() for s in students],
        'assessments': [a.to_dict() for a in assessments],
        'exported_at': datetime.utcnow().isoformat()
    }
    
    return jsonify(export_data), 200


# ========================================
# ========================================
# DYNAMIC CONTENT SYSTEM HELPERS
# ========================================

def get_previous_test_score(student_id, test_type):
    """Checks the last completed assessment for the student and returns the score of a test type, or None if not found"""
    try:
        last_assessment = Assessment.query.filter_by(student_id=student_id, status='completed').order_by(Assessment.completed_at.desc()).first()
        if last_assessment:
            last_test = TestResult.query.filter_by(assessment_id=last_assessment.id, test_type=test_type).first()
            if last_test:
                return last_test.score
    except Exception as e:
        logger.error(f"Error reading previous test score: {e}")
    return None

def adjust_difficulty(base_difficulty, prev_score):
    """Adjusts difficulty level ('easy', 'medium', 'hard') based on previous score"""
    difficulties = ['easy', 'medium', 'hard']
    if prev_score is None:
        return base_difficulty
        
    current_idx = difficulties.index(base_difficulty)
    if prev_score > 80:
        new_idx = min(current_idx + 1, 2)
        return difficulties[new_idx]
    elif prev_score < 50:
        new_idx = max(current_idx - 1, 0)
        return difficulties[new_idx]
    return base_difficulty

def generate_reading_content(age, student_id=None):
    prev_score = get_previous_test_score(student_id, 'reading') if student_id else None
    
    if age < 8:
        base_diff = 'easy'
    elif age <= 10:
        base_diff = 'medium'
    else:
        base_diff = 'hard'
        
    diff = adjust_difficulty(base_diff, prev_score)
    
    # Calculate Expected WPM based on age
    if age <= 6:
        expected_wpm = 50
    elif age <= 8:
        expected_wpm = 80
    elif age <= 10:
        expected_wpm = 110
    else:
        expected_wpm = 130

    items = None
    
    if age < 8: # Age 5-7
        # Alphabets, numbers, simple pictures of fruits/animals
        text = "A B C D E. 1 2 3 4 5. CAT DOG SUN. APPLE BANANA MILK."
        items = [
            {"type": "letter", "value": "A"},
            {"type": "letter", "value": "B"},
            {"type": "letter", "value": "C"},
            {"type": "letter", "value": "D"},
            {"type": "letter", "value": "E"},
            {"type": "number", "value": "1"},
            {"type": "number", "value": "2"},
            {"type": "number", "value": "3"},
            {"type": "number", "value": "4"},
            {"type": "number", "value": "5"},
            {"type": "word", "value": "CAT", "emoji": "🐱"},
            {"type": "word", "value": "DOG", "emoji": "🐶"},
            {"type": "word", "value": "SUN", "emoji": "☀️"},
            {"type": "word", "value": "APPLE", "emoji": "🍎"},
            {"type": "word", "value": "BANANA", "emoji": "🍌"},
            {"type": "word", "value": "MILK", "emoji": "🥛"}
        ]
    elif age <= 10: # Age 8-10
        # Small words, simple sentences
        stories = [
            "The quick brown fox jumps over the lazy dog. A warm sunny day in the green forest. The little red bird sings a sweet song. We like to play games with our friends in the garden.",
            "A cute little puppy found a shiny red ball. It played with a soft kitten near the tall tree. They ran around and had a lot of fun on a warm sunny afternoon in the yard."
        ]
        text = random.choice(stories)
    else: # Age 11-14
        # Medium sentences with paragraph and vocabulary
        topics = [
            "Exploration of the deep ocean reveals a mysterious environment filled with unique creatures. Marine biologists study how these organisms adapt to freezing temperatures and high pressure. Many deep-sea fish generate their own light through bioluminescence to attract prey in the absolute darkness. Understanding these ecosystems is vital for preserving global biodiversity.",
            "Humanity's journey into space has unlocked fascinating discoveries about Mars and distant stars. Robotic rovers traverse the dusty red plains of Mars, analyzing soil composition and searching for signs of water. Meanwhile, deep space telescopes capture light emitted billions of years ago, giving cosmologists a glimpse into the early universe. Executing these missions requires complex engineering."
        ]
        text = random.choice(topics)
        
    return text, items, diff, expected_wpm

def generate_math_questions(age, student_id=None):
    prev_score = get_previous_test_score(student_id, 'math') if student_id else None
    
    if age < 7:
        base_diff = 'easy'
    elif age <= 9:
        base_diff = 'medium'
    else:
        base_diff = 'hard'
        
    diff = adjust_difficulty(base_diff, prev_score)
    questions = []
    
    if age < 7:
        # For 5-6 year olds: counting shapes, single digit addition/subtraction
        problems = [
            ("Count the dots: ●●●. How many?", 3, ["2", "3", "4", "5"]),
            ("What is 1 + 1?", 2, ["1", "2", "3", "4"]),
            ("What number comes after 4?", 5, ["3", "4", "5", "6"]),
            ("What is 3 - 1?", 2, ["1", "2", "3", "0"]),
            ("Count the stars: ★★★★★. How many?", 5, ["4", "5", "6", "7"])
        ]
        for i, (q_text, ans, opts) in enumerate(problems):
            questions.append({
                'id': i + 1,
                'question': q_text,
                'options': opts,
                'correct': str(ans),
                'metadata': {
                    opts[0]: 'calculation slip',
                    opts[2]: 'calculation slip',
                    opts[3]: 'calculation slip'
                }
            })
    elif diff == 'easy' or diff == 'medium' or (age <= 9):
        # For 7-9 year olds: simple single-digit equations up to 20
        for i in range(5):
            x = random.randint(3, 9)
            y = random.randint(2, 9)
            op = random.choice(['+', '-'])
            if op == '+':
                ans = x + y
                q_text = f"What is {x} + {y}?"
            else:
                x = max(x, y)
                y = min(x, y)
                if x == y:
                    x += random.randint(1, 4)
                ans = x - y
                q_text = f"What is {x} - {y}?"
                
            options = list(set([ans, ans + 2, ans - 1, ans + 1, ans + 3]))[:4]
            if ans not in options:
                options[0] = ans
            random.shuffle(options)
            
            questions.append({
                'id': i + 1,
                'question': q_text,
                'options': [str(o) for o in options],
                'correct': str(ans),
                'metadata': {
                    str(ans + 2): 'calculation slip',
                    str(ans - 1): 'calculation slip',
                    str(ans + 1): 'calculation slip'
                }
            })
    else:
        # For 10-12 year olds: multiplications, divisions, order of operations
        for i in range(5):
            q_type = random.choice(['mult', 'div', 'order', 'frac'])
            if q_type == 'mult':
                x = random.randint(11, 20)
                y = random.randint(3, 9)
                ans = x * y
                q_text = f"What is {x} × {y}?"
            elif q_type == 'div':
                y = random.randint(4, 12)
                ans = random.randint(6, 15)
                x = y * ans
                q_text = f"What is {x} ÷ {y}?"
            elif q_type == 'order':
                a = random.randint(3, 6)
                b = random.randint(2, 5)
                c = random.randint(3, 9)
                ans = a * b + c
                q_text = f"What is {a} × {b} + {c}?"
            else:
                pct = random.choice([10, 20, 25, 50])
                val = random.choice([60, 80, 100, 120, 150, 200])
                ans = int((pct / 100) * val)
                q_text = f"What is {pct}% of {val}?"
                
            options = list(set([ans, ans + 5, ans - 5, ans + 10, ans - 10]))[:4]
            if ans not in options:
                options[0] = ans
            random.shuffle(options)
            
            questions.append({
                'id': i + 1,
                'question': q_text,
                'options': [str(o) for o in options],
                'correct': str(ans),
                'metadata': {
                    str(ans + 5): 'calculation slip',
                    str(ans - 5): 'calculation slip',
                    str(ans + 10): 'conceptual error'
                }
            })
            
    return questions, diff

def generate_puzzle_questions(age, student_id=None):
    prev_score = get_previous_test_score(student_id, 'puzzle') if student_id else None
    
    if age < 7:
        base_diff = 'easy'
    elif age <= 9:
        base_diff = 'medium'
    else:
        base_diff = 'hard'
        
    diff = adjust_difficulty(base_diff, prev_score)
    questions = []
    
    if age < 7:
        # For 5-6 year olds: shape patterns, letter sequences, missing number
        questions.append({
            'id': 1,
            'question': "Complete the shapes pattern: ●, ▲, ●, ▲, ?",
            'options': ["●", "▲", "■", "★"],
            'correct': "●",
            'explanation': "The pattern goes circle, triangle, circle, triangle. The next is circle."
        })
        questions.append({
            'id': 2,
            'question': "Complete the letters pattern: A, B, A, B, ?",
            'options': ["A", "B", "C", "D"],
            'correct': "A",
            'explanation': "The letters swap between A and B. Next is A."
        })
        questions.append({
            'id': 3,
            'question': "Find the missing number in the line: 1, 2, 3, ?, 5",
            'options': ["2", "4", "6", "0"],
            'correct': "4",
            'explanation': "Counting normally goes 1, 2, 3, 4, 5."
        })
    elif diff == 'easy' or diff == 'medium' or (age <= 9):
        # For 7-9 year olds: easy number lists, basic word reasoning
        start = random.randint(2, 10)
        step = random.choice([2, 3])
        seq = [start + j * step for j in range(4)]
        ans = start + 4 * step
        q1_text = f"Complete the sequence: {seq[0]}, {seq[1]}, {seq[2]}, {seq[3]}, ?"
        options1 = list(set([ans, ans + step, ans - step, ans + 1]))[:4]
        if ans not in options1:
            options1[0] = ans
        random.shuffle(options1)
        questions.append({
            'id': 1,
            'question': q1_text,
            'options': [str(o) for o in options1],
            'correct': str(ans),
            'explanation': f"The sequence increases by {step} each time."
        })
        
        animal_pairs = [("rabbits", "turtles"), ("dogs", "cats"), ("horses", "donkeys")]
        pair = random.choice(animal_pairs)
        questions.append({
            'id': 2,
            'question': f"If all {pair[0]} run faster than {pair[1]}, and Nutty is a {pair[0]}, is Nutty faster than {pair[1]}?",
            'options': ["Yes", "No", "Cannot determine"],
            'correct': "Yes",
            'explanation': f"Since all {pair[0]} are faster than {pair[1]} and Nutty is one of them, Nutty must be faster."
        })
        
        letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
        start_idx = random.randint(0, 3)
        seq_let = [letters[start_idx + j] for j in range(4)]
        ans_let = letters[start_idx + 4]
        q3_text = f"What comes next: {seq_let[0]}, {seq_let[1]}, {seq_let[2]}, {seq_let[3]}, ?"
        options3 = [ans_let, letters[start_idx + 3], letters[start_idx + 5], 'Z']
        random.shuffle(options3)
        questions.append({
            'id': 3,
            'question': q3_text,
            'options': options3,
            'correct': ans_let,
            'explanation': "The letters follow consecutive alphabetical order."
        })
    else:
        # For 10-12 year olds: complex sequences, transitivity, letter cycles
        a, b = random.choice([(1, 2), (2, 3), (1, 3)])
        seq = [a, b, a+b, b+a+b, a+b+b+a+b]
        ans = seq[-1] + seq[-2]
        q1_text = f"Find the next term in the sequence: {seq[0]}, {seq[1]}, {seq[2]}, {seq[3]}, {seq[4]}, ?"
        options1 = list(set([ans, ans + 2, ans - 2, ans + 5]))[:4]
        if ans not in options1:
            options1[0] = ans
        random.shuffle(options1)
        questions.append({
            'id': 1,
            'question': q1_text,
            'options': [str(o) for o in options1],
            'correct': str(ans),
            'explanation': "Each number is the sum of the two preceding numbers."
        })
        
        items = [("circles", "squares", "shapes"), ("cats", "mammals", "animals"), ("roses", "flowers", "plants")]
        it = random.choice(items)
        questions.append({
            'id': 2,
            'question': f"If all {it[0]} are {it[1]}, and all {it[1]} are {it[2]}, are all {it[0]} also {it[2]}?",
            'options': ["Yes", "No", "Cannot determine"],
            'correct': "Yes",
            'explanation': f"Yes, transitively since all {it[0]} belong to {it[1]}, and all {it[1]} belong to {it[2]}."
        })
        
        letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        start_idx = random.randint(4, 15)
        seq_let = []
        for j in range(5):
          if j % 2 == 0:
            seq_let.append(letters[start_idx + j//2])
          else:
            seq_let.append(letters[25 - j//2])
        ans_let = letters[25 - 5//2 - 1]
        q3_text = f"What comes next in the sequence: {seq_let[0]}, {seq_let[1]}, {seq_let[2]}, {seq_let[3]}, {seq_let[4]}, ?"
        options3 = [ans_let, letters[start_idx + 3], 'W', 'V']
        random.shuffle(options3)
        questions.append({
            'id': 3,
            'question': q3_text,
            'options': options3,
            'correct': ans_let,
            'explanation': "The sequence alternates between forward alphabetical and backward alphabetical letters."
        })
        
    return questions, diff

def generate_writing_words(age, student_id=None):
    prev_score = get_previous_test_score(student_id, 'writing') if student_id else None
    
    if age < 7:
        base_diff = 'easy'
    elif age <= 9:
        base_diff = 'medium'
    else:
        base_diff = 'hard'
        
    diff = adjust_difficulty(base_diff, prev_score)
    
    if age < 7:
        # For 5-6 year olds: single letters and digits to trace/write on the canvas
        pool = ['A', 'B', 'C', 'H', 'T', '1', '3', '7', '8']
    elif diff == 'easy' or diff == 'medium' or (age <= 9):
        # For 7-9 year olds: simple 3-4 letter words
        pool = ['cat', 'dog', 'ball', 'sun', 'star', 'tree', 'jump', 'play', 'fish', 'bird', 'toy', 'hat']
    else:
        # For 10-12 year olds: longer 6-9 letter words
        pool = ['dinosaur', 'computer', 'mountain', 'elephant', 'science', 'universe', 'building', 'chemistry']
        
    words = random.sample(pool, min(5, len(pool)))
    return words, diff


# ========================================
# DATA RETRIEVAL ENDPOINTS
# ========================================

@app.route('/api/reading-text', methods=['GET'])
def get_reading_text_endpoint():
    """Get dynamic reading text adjusted to age and history"""
    age = request.args.get('age', 8, type=int)
    student_id = request.args.get('student_id', None, type=int)
    
    text, items, diff, expected_wpm = generate_reading_content(age, student_id)
    word_count = len(text.split())
    ideal_time = max(15, int((word_count / expected_wpm) * 60))
    
    return jsonify({
        'text': text,
        'items': items,
        'word_count': word_count,
        'expected_wpm': expected_wpm,
        'ideal_time': ideal_time,
        'difficulty': diff
    }), 200


@app.route('/api/math-questions', methods=['GET'])
def get_math_questions_endpoint():
    """Get dynamic math questions based on age and history"""
    age = request.args.get('age', 8, type=int)
    student_id = request.args.get('student_id', None, type=int)
    
    questions, diff = generate_math_questions(age, student_id)
    
    return jsonify({
        'questions': questions,
        'difficulty': diff,
        'total': len(questions)
    }), 200


@app.route('/api/puzzle-questions', methods=['GET'])
def get_puzzle_questions_endpoint():
    """Get dynamic puzzle questions based on age and history"""
    age = request.args.get('age', 8, type=int)
    student_id = request.args.get('student_id', None, type=int)
    
    questions, diff = generate_puzzle_questions(age, student_id)
    
    return jsonify({
        'questions': questions,
        'difficulty': diff,
        'total': len(questions)
    }), 200


@app.route('/api/writing-words', methods=['GET'])
def get_writing_words_endpoint():
    """Get dynamic writing words based on age and history"""
    age = request.args.get('age', 8, type=int)
    student_id = request.args.get('student_id', None, type=int)
    
    words, diff = generate_writing_words(age, student_id)
    
    return jsonify({
        'words': words,
        'count': len(words),
        'difficulty': diff
    }), 200


# ========================================
# RUN APPLICATION
# ========================================

def run_migrations():
    import sqlite3
    db_path = os.path.join(app.instance_path, 'learning_disability.db')
    if os.path.exists(db_path):
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Migrate test_results table
            cursor.execute("PRAGMA table_info(test_results)")
            columns = [row[1] for row in cursor.fetchall()]
            
            new_cols = [
                ('reading_accuracy', 'REAL'),
                ('pronunciation_score', 'REAL'),
                ('reading_wpm', 'REAL'),
                ('actual_time', 'INTEGER'),
                ('delay_percentage', 'REAL'),
                ('mispronounced_words', 'INTEGER'),
                ('skipped_words', 'INTEGER'),
                ('severity_score', 'TEXT')
            ]
            
            migrated = False
            for col_name, col_type in new_cols:
                if col_name not in columns:
                    cursor.execute(f"ALTER TABLE test_results ADD COLUMN {col_name} {col_type}")
                    logger.info(f"Migration: Added column {col_name} to test_results table")
                    migrated = True
            
            # Migrate predictions table to add missing indicators
            cursor.execute("PRAGMA table_info(predictions)")
            pred_columns = [row[1] for row in cursor.fetchall()]
            
            new_pred_cols = [
                ('reading_indicator', 'REAL'),
                ('writing_indicator', 'REAL'),
                ('math_indicator', 'REAL'),
                ('logic_indicator', 'REAL')
            ]
            
            for col_name, col_type in new_pred_cols:
                if col_name not in pred_columns:
                    cursor.execute(f"ALTER TABLE predictions ADD COLUMN {col_name} {col_type}")
                    logger.info(f"Migration: Added column {col_name} to predictions table")
                    migrated = True
                    
            if migrated:
                conn.commit()
            conn.close()
        except Exception as e:
            logger.error(f"Migration error: {e}")

@app.route('/api/debug/download-brain', methods=['GET'])
def debug_download_brain():
    import urllib.request
    import os
    
    url = "https://raw.githubusercontent.com/savir2010/Aurna/main/brain.glb"
    dest_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "models")
    dest_path = os.path.join(dest_dir, "brain.glb")
    
    try:
        os.makedirs(dest_dir, exist_ok=True)
        logger.info(f"Downloading brain.glb from {url} to {dest_path}...")
        urllib.request.urlretrieve(url, dest_path)
        logger.info("Download completed successfully!")
        return jsonify({"status": "success", "message": f"Downloaded to {dest_path}"}), 200
    except Exception as e:
        logger.error(f"Download failed: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

def train_model_in_process():
    """
    Retrain the RandomForest model package using current dataset labeling rules
    and save/load it directly in process memory.
    """
    import pandas as pd
    from sklearn.model_selection import train_test_split
    from sklearn.ensemble import RandomForestClassifier
    import joblib
    import os
    import numpy as np
    
    logger.info("Starting in-process RandomForest model retraining...")
    
    try:
        n_samples = 2000
        np.random.seed(42)
        
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
        
        model = RandomForestClassifier(
            n_estimators=150,
            max_depth=12,
            min_samples_split=4,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        )
        model.fit(X_train, y_train)
        
        # Save model pack
        model_dir = os.path.join(os.path.dirname(__file__), 'models')
        os.makedirs(model_dir, exist_ok=True)
        model_path = os.path.join(model_dir, 'model.pkl')
        
        label_map = {
            0: 'No Learning Disability Detected',
            1: 'Dyslexia',
            2: 'Dysgraphia',
            3: 'Dyscalculia',
            4: 'ADHD',
            5: 'High Risk / Severe Difficulty'
        }
        
        model_package_new = {
            'model': model,
            'features': feature_columns,
            'label_map': label_map
        }
        joblib.dump(model_package_new, model_path)
        
        # Save CSV
        dataset_path = os.path.join(os.path.dirname(__file__), 'data', 'training_dataset.csv')
        os.makedirs(os.path.dirname(dataset_path), exist_ok=True)
        df.to_csv(dataset_path, index=False)
        
        # Dynamically reload globally in Flask
        global model_package
        model_package = model_package_new
        
        logger.info("Successfully retrained and reloaded RandomForest model in-process!")
        return {
            'status': 'success',
            'train_accuracy': float(model.score(X_train, y_train)),
            'test_accuracy': float(model.score(X_test, y_test))
        }
    except Exception as e:
        logger.error(f"In-process training failed: {e}")
        return {'status': 'error', 'message': str(e)}

@app.route('/api/admin/train', methods=['GET', 'POST'])
def train_model_endpoint():
    """
    Retrain the RandomForest model package using current dataset labeling rules
    and save/load it directly in process memory.
    """
    res = train_model_in_process()
    if res.get('status') == 'success':
        return jsonify({
            'status': 'success',
            'message': 'Model retrained and loaded successfully in-process',
            'train_accuracy': res.get('train_accuracy'),
            'test_accuracy': res.get('test_accuracy')
        }), 200
    else:
        return jsonify({'status': 'error', 'message': res.get('message')}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        run_migrations()
        logger.info('Database initialized')
        
    # Auto-train on startup (Task 15)
    train_res = train_model_in_process()
    if train_res.get('status') == 'success':
        logger.info(f"Model auto-trained on startup. Train acc: {train_res['train_accuracy']:.2f}, Test acc: {train_res['test_accuracy']:.2f}")
    else:
        logger.error(f"Model auto-training failed on startup: {train_res.get('message')}")
    
    print("\n" + "=" * 60)
    print("STARTING LEARNING DISABILITY DETECTION API")
    print("=" * 60)
    print("\nRunning on: http://localhost:5000")
    print("API Base: http://localhost:5000/api")
    print("\nAvailable Endpoints:")
    print("   AUTH: /api/auth/login, /api/auth/register, /api/auth/logout")
    print("   STUDENTS: /api/students")
    print("   ASSESSMENTS: /api/assessments/start, /api/assessments/<id>")
    print("   TESTS: /api/tests/reading, /api/tests/writing, /api/tests/math, /api/tests/puzzle")
    print("   RESULTS: /api/results/analyze, /api/results/<id>")
    print("   HISTORY: /api/history, /api/reports/<id>")
    print("   DATA: /api/reading-text, /api/math-questions, /api/puzzle-questions, /api/writing-words")
    print("\n" + "=" * 60)
    
    app.run(debug=True, host='0.0.0.0', port=5000)
