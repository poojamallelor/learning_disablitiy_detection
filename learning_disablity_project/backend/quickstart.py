"""
Quick Start Script For Windows
==============================

Run this script to quickly setup and test the ML pipeline.

Usage:
  python quickstart.py
"""

import os
import sys
import subprocess
import time
from pathlib import Path

def print_header(text):
    print(f"\n{'='*60}")
    print(f"  {text}")
    print(f"{'='*60}\n")

def print_success(text):
    print(f"✅ {text}")

def print_info(text):
    print(f"ℹ️  {text}")

def print_warning(text):
    print(f"⚠️  {text}")

def run_command(cmd, description):
    """Run a command and handle errors"""
    print_info(f"Running: {cmd}")
    try:
        result = subprocess.run(cmd, shell=True, capture_output=False)
        if result.returncode == 0:
            print_success(description)
            return True
        else:
            print_warning(f"Failed: {description}")
            return False
    except Exception as e:
        print_warning(f"Error: {str(e)}")
        return False

def main():
    print_header("🚀 LEARNING DISABILITY DETECTION - QUICK START")
    
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    
    # Step 1: Check Python
    print_info("Step 1: Checking Python installation...")
    python_version = subprocess.run([sys.executable, '--version'], capture_output=True, text=True)
    print_info(f"Python: {python_version.stdout.strip()}")
    print_success("Python is available")
    
    # Step 2: Check virtual environment
    print_info("\nStep 2: Checking virtual environment...")
    if hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print_success("Virtual environment is active")
    else:
        print_warning("Virtual environment NOT active")
        print_info("Activate with:")
        print_info("  Windows PowerShell: .\\venv\\Scripts\\Activate.ps1")
        print_info("  Windows CMD: venv\\Scripts\\activate.bat")
        print_info("  Conda: conda activate learning-disability")
    
    # Step 3: Install dependencies
    print_info("\nStep 3: Installing dependencies...")
    if run_command(f"{sys.executable} -m pip install -q -r requirements.txt", "Dependencies installed"):
        pass
    else:
        print_warning("Could not install some dependencies")
    
    # Step 4: Train model
    print_info("\nStep 4: Training ML model...")
    print_info("This may take 30-60 seconds...")
    if run_command(f"{sys.executable} train_model.py", "Model trained successfully"):
        pass
    else:
        print_warning("Model training failed")
        return
    
    # Step 5: Start API
    print_header("✅ SETUP COMPLETE!")
    print("\nThe model has been trained successfully!")
    print("\nNext, start the API server:")
    print("  python main.py")
    print("\nThen:")
    print("  - Open: http://localhost:8000/docs")
    print("  - Test the /predict endpoint")
    print("  - Use test_api.py to run automated tests")
    print("\n" + "="*60 + "\n")

if __name__ == "__main__":
    main()
