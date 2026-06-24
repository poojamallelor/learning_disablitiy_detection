"""
Test Script for Learning Disability Detection Pipeline
========================================================

This script tests the API endpoints without needing to use browser or curl.
Useful for quick testing and debugging.

Usage:
  python test_api.py
"""

import requests
import json
import time
from typing import Dict, Any

# API Base URL
API_URL = "http://localhost:8000"

# Color codes for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
BLUE = '\033[94m'
YELLOW = '\033[93m'
RESET = '\033[0m'
BOLD = '\033[1m'

def print_header(text: str):
    """Print formatted header"""
    print(f"\n{BOLD}{BLUE}{'='*60}{RESET}")
    print(f"{BOLD}{BLUE}{text}{RESET}")
    print(f"{BOLD}{BLUE}{'='*60}{RESET}")


def print_success(text: str):
    """Print success message"""
    print(f"{GREEN}✅ {text}{RESET}")


def print_error(text: str):
    """Print error message"""
    print(f"{RED}❌ {text}{RESET}")


def print_info(text: str):
    """Print info message"""
    print(f"{BLUE}ℹ️  {text}{RESET}")


def print_test(text: str):
    """Print test label"""
    print(f"\n{YELLOW}🧪 {text}{RESET}")


# ==========================================
# TEST 1: Health Check
# ==========================================
def test_health_check():
    """Test health endpoint"""
    print_test("Testing Health Check Endpoint")
    
    try:
        response = requests.get(f"{API_URL}/health", timeout=5)
        response.raise_for_status()
        
        data = response.json()
        print(f"\nResponse Status: {response.status_code}")
        print(f"Response: {json.dumps(data, indent=2)}")
        
        if data.get("model_loaded"):
            print_success("Model is loaded!")
            return True
        else:
            print_error("Model is not loaded!")
            return False
            
    except requests.exceptions.ConnectionError:
        print_error("Could not connect to API. Is the server running?")
        print_info("Run: python main.py")
        return False
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return False


# ==========================================
# TEST 2: Get Labels
# ==========================================
def test_get_labels():
    """Test get labels endpoint"""
    print_test("Testing Get Labels Endpoint")
    
    try:
        response = requests.get(f"{API_URL}/labels", timeout=5)
        response.raise_for_status()
        
        data = response.json()
        print(f"\nResponse Status: {response.status_code}")
        print(f"Available Labels:")
        
        for code, label in data.get("labels", {}).items():
            print(f"  {code}: {label}")
        
        print_success("Labels retrieved successfully!")
        return True
        
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return False


# ==========================================
# TEST 3: Make Predictions
# ==========================================
def test_predictions():
    """Test prediction endpoint with multiple test cases"""
    print_test("Testing Prediction Endpoint")
    
    # Test cases
    test_cases = [
        {
            "name": "Low Reading (Dyslexia)",
            "data": {"reading": 40, "writing": 75, "math": 80, "attention": 70}
        },
        {
            "name": "Low Writing (Dysgraphia)",
            "data": {"reading": 75, "writing": 45, "math": 80, "attention": 70}
        },
        {
            "name": "Low Math (Dyscalculia)",
            "data": {"reading": 75, "writing": 75, "math": 40, "attention": 70}
        },
        {
            "name": "Low Attention (ADHD)",
            "data": {"reading": 75, "writing": 75, "math": 75, "attention": 35}
        },
        {
            "name": "All Normal",
            "data": {"reading": 85, "writing": 85, "math": 85, "attention": 85}
        }
    ]
    
    all_passed = True
    
    for test_case in test_cases:
        print(f"\n{YELLOW}Test: {test_case['name']}{RESET}")
        
        try:
            response = requests.post(
                f"{API_URL}/predict",
                json=test_case['data'],
                timeout=5
            )
            response.raise_for_status()
            
            data = response.json()
            
            print(f"  Input: {test_case['data']}")
            print(f"  Prediction: {data.get('prediction')}")
            print(f"  Confidence: {data.get('confidence'):.2%}")
            print(f"  Code: {data.get('prediction_code')}")
            
            print_success(f"Prediction received!")
            
        except Exception as e:
            print_error(f"Prediction failed: {str(e)}")
            all_passed = False
    
    return all_passed


# ==========================================
# TEST 4: Invalid Input Handling
# ==========================================
def test_invalid_input():
    """Test error handling with invalid inputs"""
    print_test("Testing Invalid Input Handling")
    
    # Test: Score out of range
    print(f"\n{YELLOW}Test: Score > 100{RESET}")
    try:
        response = requests.post(
            f"{API_URL}/predict",
            json={"reading": 150, "writing": 80, "math": 70, "attention": 50},
            timeout=5
        )
        
        if response.status_code != 200:
            print_success("Invalid input rejected as expected!")
        else:
            print_error("Invalid input was accepted (should be rejected)")
            
    except Exception as e:
        print_info(f"Response: {str(e)}")
    
    # Test: Negative score
    print(f"\n{YELLOW}Test: Negative score{RESET}")
    try:
        response = requests.post(
            f"{API_URL}/predict",
            json={"reading": -10, "writing": 80, "math": 70, "attention": 50},
            timeout=5
        )
        
        if response.status_code != 200:
            print_success("Negative score rejected as expected!")
        else:
            print_error("Negative score was accepted (should be rejected)")
            
    except Exception as e:
        print_info(f"Response: {str(e)}")
    
    # Test: Missing field
    print(f"\n{YELLOW}Test: Missing field{RESET}")
    try:
        response = requests.post(
            f"{API_URL}/predict",
            json={"reading": 60, "writing": 80, "math": 70},
            timeout=5
        )
        
        if response.status_code != 200:
            print_success("Missing field rejected as expected!")
        else:
            print_error("Missing field was accepted (should be rejected)")
            
    except Exception as e:
        print_info(f"Response: {str(e)}")


# ==========================================
# TEST 5: Performance Test
# ==========================================
def test_performance():
    """Test API response time"""
    print_test("Testing API Performance")
    
    predictions_count = 10
    times = []
    
    print(f"\nMaking {predictions_count} predictions...")
    
    for i in range(predictions_count):
        try:
            start_time = time.time()
            
            response = requests.post(
                f"{API_URL}/predict",
                json={"reading": 60, "writing": 80, "math": 70, "attention": 50},
                timeout=5
            )
            response.raise_for_status()
            
            elapsed_time = time.time() - start_time
            times.append(elapsed_time)
            
            print(f"  Request {i+1}: {elapsed_time*1000:.2f}ms")
            
        except Exception as e:
            print_error(f"Request {i+1} failed: {str(e)}")
    
    if times:
        avg_time = sum(times) / len(times)
        min_time = min(times)
        max_time = max(times)
        
        print(f"\n{BOLD}Performance Summary:{RESET}")
        print(f"  Average Response Time: {avg_time*1000:.2f}ms")
        print(f"  Min Response Time: {min_time*1000:.2f}ms")
        print(f"  Max Response Time: {max_time*1000:.2f}ms")
        print(f"  Total Requests: {len(times)}")
        
        if avg_time < 0.1:  # Less than 100ms
            print_success("Performance is excellent!")
        elif avg_time < 0.5:  # Less than 500ms
            print_success("Performance is good!")
        else:
            print_info("Performance is acceptable")


# ==========================================
# MAIN TEST RUNNER
# ==========================================
def main():
    """Run all tests"""
    print_header("🧪 Learning Disability Detection API - Test Suite")
    
    print(f"\n{BOLD}Testing API at:{RESET} {API_URL}")
    print(f"\n{YELLOW}Make sure API server is running!{RESET}")
    print(f"Run: {BOLD}python main.py{RESET}\n")
    
    # Run tests
    results = {
        "Health Check": test_health_check(),
        "Get Labels": test_get_labels(),
        "Predictions": test_predictions(),
        "Invalid Input": test_invalid_input(),
        "Performance": test_performance()
    }
    
    # Print summary
    print_header("📊 Test Summary")
    
    for test_name, passed in results.items():
        status = "PASSED" if passed else "FAILED"
        symbol = "✅" if passed else "❌"
        print(f"{symbol} {test_name}: {status}")
    
    total_passed = sum(1 for p in results.values() if p)
    total_tests = len(results)
    
    print(f"\n{BOLD}Total: {total_passed}/{total_tests} tests completed{RESET}\n")
    
    if total_passed == total_tests:
        print_success("All tests passed! API is working correctly!")
    else:
        print_error("Some tests failed. Check the output above.")


if __name__ == "__main__":
    main()
