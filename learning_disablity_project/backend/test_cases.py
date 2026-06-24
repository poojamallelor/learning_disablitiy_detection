"""
Test script to verify all 5 clinical evaluation test cases (A, B, C, D, and E)
for the Learning Disability Detection system.

Usage:
  1. Start the backend: python main.py
  2. Run this script: python test_cases.py
"""

import requests
import json
import uuid

API_URL = "http://localhost:5000/api"

# Format colors
GREEN = '\033[92m'
RED = '\033[91m'
BLUE = '\033[94m'
YELLOW = '\033[93m'
RESET = '\033[0m'
BOLD = '\033[1m'

def print_header(text: str):
    print(f"\n{BOLD}{BLUE}{'='*80}{RESET}")
    print(f"{BOLD}{BLUE}{text}{RESET}")
    print(f"{BOLD}{BLUE}{'='*80}{RESET}")

def run_test_cases():
    print_header("Initializing Test Suite for Learning Disability Assessment Pipeline")
    
    # 1. Register a test user
    username = f"tester_{uuid.uuid4().hex[:6]}"
    email = f"{username}@example.com"
    password = "Testpassword123"
    
    print(f"Registering test user: {username}...")
    reg_res = requests.post(f"{API_URL}/auth/register", json={
        "username": username,
        "email": email,
        "password": password,
        "role": "parent",
        "full_name": "Test Administrator"
    })
    
    if reg_res.status_code != 201:
        print(f"{RED}Registration failed: {reg_res.text}{RESET}")
        return
        
    token = reg_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    print(f"{GREEN}✓ User registered successfully.{RESET}")
    
    # 2. Create a student profile
    student_res = requests.post(f"{API_URL}/students", headers=headers, json={
        "name": "Test Child",
        "age": 9,
        "grade": "4th Grade",
        "gender": "male"
    })
    
    if student_res.status_code != 201:
        print(f"{RED}Failed to create student: {student_res.text}{RESET}")
        return
        
    student_id = student_res.json()["student"]["id"]
    print(f"{GREEN}✓ Student profile created. ID: {student_id}{RESET}")
    
    # Define the 5 evaluation cases
    eval_cases = [
        {
            "id": "A",
            "name": "Case A: Severe / Skipped Overall Risk Profile",
            "reading": {
                "original_text": "The quick brown fox jumps over the lazy dog.",
                "spoken_text": "", # Empty spoken text
                "actual_time": 0, # Missing reading time
                "audio_base64": "" # Missing audio
            },
            "writing": {
                "score": 0,
                "accuracy": 0,
                "details": {
                    "written_words": [] # Blank input
                }
            },
            "math": {
                "score": 0,
                "details": {
                    "answers": {}, # No answers
                    "total_questions": 5,
                    "correct_answers": 0
                }
            },
            "puzzle": {
                "score": 0,
                "details": {
                    "answers": {}, # No answers
                    "correct_answers": 0
                }
            },
            "expected": "High Risk / Severe Difficulty"
        },
        {
            "id": "B",
            "name": "Case B: Excellent (Healthy Control Profile)",
            "reading": {
                "original_text": "The quick brown fox jumps over the lazy dog.",
                "spoken_text": "The quick brown fox jumps over the lazy dog.",
                "actual_time": 20,
                "audio_base64": "UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="
            },
            "writing": {
                "score": 98.0,
                "accuracy": 98.0,
                "details": {
                    "written_words": [{"word": "cat", "spelling": True, "clarity": 98.0}]
                }
            },
            "math": {
                "score": 100.0,
                "details": {
                    "answers": {"1": "true", "2": "true", "3": "true", "4": "true", "5": "true"},
                    "total_questions": 5,
                    "correct_answers": 5
                }
            },
            "puzzle": {
                "score": 100.0,
                "details": {
                    "answers": {"1": "true", "2": "true", "3": "true"},
                    "correct_answers": 3
                }
            },
            "expected": "No Learning Disability Detected"
        },
        {
            "id": "C",
            "name": "Case C: Poor Reading Only (Dyslexia Profile)",
            "reading": {
                "original_text": "The quick brown fox jumps over the lazy dog.",
                "spoken_text": "The fast jump over dog.",
                "actual_time": 45,
                "audio_base64": "UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="
            },
            "writing": {
                "score": 90.0,
                "accuracy": 90.0,
                "details": {
                    "written_words": [{"word": "cat", "spelling": True, "clarity": 90.0}]
                }
            },
            "math": {
                "score": 90.0,
                "details": {
                    "answers": {"1": "true", "2": "true", "3": "true", "4": "true", "5": "true"},
                    "total_questions": 5,
                    "correct_answers": 5
                }
            },
            "puzzle": {
                "score": 90.0,
                "details": {
                    "answers": {"1": "true", "2": "true", "3": "true"},
                    "correct_answers": 3
                }
            },
            "expected": "Dyslexia"
        },
        {
            "id": "D",
            "name": "Case D: Poor Writing Only (Dysgraphia Profile)",
            "reading": {
                "original_text": "The quick brown fox jumps over the lazy dog.",
                "spoken_text": "The quick brown fox jumps over the lazy dog.",
                "actual_time": 20,
                "audio_base64": "UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="
            },
            "writing": {
                "score": 40.0,
                "accuracy": 40.0,
                "details": {
                    "written_words": [{"word": "cat", "spelling": False, "clarity": 30.0}],
                    "handwriting_clarity": 30.0
                }
            },
            "math": {
                "score": 90.0,
                "details": {
                    "answers": {"1": "true", "2": "true", "3": "true", "4": "true", "5": "true"},
                    "total_questions": 5,
                    "correct_answers": 5
                }
            },
            "puzzle": {
                "score": 90.0,
                "details": {
                    "answers": {"1": "true", "2": "true", "3": "true"},
                    "correct_answers": 3
                }
            },
            "expected": "Dysgraphia"
        },
        {
            "id": "E",
            "name": "Case E: Poor Math Only (Dyscalculia Profile)",
            "reading": {
                "original_text": "The quick brown fox jumps over the lazy dog.",
                "spoken_text": "The quick brown fox jumps over the lazy dog.",
                "actual_time": 20,
                "audio_base64": "UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="
            },
            "writing": {
                "score": 90.0,
                "accuracy": 90.0,
                "details": {
                    "written_words": [{"word": "cat", "spelling": True, "clarity": 90.0}]
                }
            },
            "math": {
                "score": 30.0,
                "details": {
                    "answers": {"1": "true", "2": "false", "3": "false", "4": "false", "5": "false"},
                    "total_questions": 5,
                    "correct_answers": 1
                }
            },
            "puzzle": {
                "score": 90.0,
                "details": {
                    "answers": {"1": "true", "2": "true", "3": "true"},
                    "correct_answers": 3
                }
            },
            "expected": "Dyscalculia"
        }
    ]
    
    for case in eval_cases:
        print_header(f"RUNNING: {case['name']}")
        
        # 1. Start assessment session
        ast_res = requests.post(f"{API_URL}/assessments/start", headers=headers, json={"student_id": student_id})
        ast_id = ast_res.json()["assessment"]["id"]
        print(f"Assessment Session Started. ID: {ast_id}")
        
        # 2. Submit Reading test
        read_payload = case["reading"].copy()
        read_payload["assessment_id"] = ast_id
        requests.post(f"{API_URL}/tests/reading", headers=headers, json=read_payload)
        
        # 3. Submit Writing test
        write_payload = case["writing"].copy()
        write_payload["assessment_id"] = ast_id
        requests.post(f"{API_URL}/tests/writing", headers=headers, json=write_payload)
        
        # 4. Submit Math test
        math_payload = case["math"].copy()
        math_payload["assessment_id"] = ast_id
        requests.post(f"{API_URL}/tests/math", headers=headers, json=math_payload)
        
        # 5. Submit Puzzle test
        puzzle_payload = case["puzzle"].copy()
        puzzle_payload["assessment_id"] = ast_id
        requests.post(f"{API_URL}/tests/puzzle", headers=headers, json=puzzle_payload)
        
        # 6. Analyze and verify prediction
        print("Analyzing assessment results...")
        anal_res = requests.post(f"{API_URL}/results/analyze", headers=headers, json={"assessment_id": ast_id})
        
        if case["id"] == "A":
            # For Case A, we expect the analysis to fail with HTTP 400 "Assessment Incomplete"
            # because actual_time was 0 / not recorded.
            print(f"Response Status: {anal_res.status_code}")
            if anal_res.status_code == 400:
                body = anal_res.json()
                print(f"  Received Error Code: {body.get('error')}")
                print(f"  Received Error Message: {body.get('message')}")
                print_success("Case A verified: System successfully rejected incomplete assessment!")
            else:
                print_error(f"Case A failed: Expected HTTP 400 for incomplete reading time, but got {anal_res.status_code}")
        else:
            # For other cases, we expect a successful diagnosis
            print(f"Response Status: {anal_res.status_code}")
            if anal_res.status_code == 201:
                pred = anal_res.json()["prediction"]
                disability = pred["predicted_disability"]
                severity = pred["severity_level"]
                confidence = pred["confidence_score"] * 100
                reasoning = pred["reasoning"]
                
                print(f"  {BOLD}Predicted Disability:{RESET} {disability}")
                print(f"  {BOLD}Severity Level:{RESET}       {severity}")
                print(f"  {BOLD}Confidence:{RESET}           {confidence:.1f}%")
                print(f"  {BOLD}Reasoning:{RESET}            {reasoning}")
                print(f"  {BOLD}Recommendations:{RESET}      {pred['recommendations']}")
                
                if disability == case["expected"]:
                    print_success(f"Verified Case {case['id']}: Match predicted disability.")
                else:
                    print_error(f"Failed Case {case['id']}: Expected {case['expected']} but got {disability}")
            else:
                print_error(f"Failed Case {case['id']}: Expected HTTP 201 but got {anal_res.status_code} - {anal_res.text}")

if __name__ == "__main__":
    run_test_cases()
