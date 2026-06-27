#!/bin/bash

# Learning Disability Detection System - Setup Script for Mac/Linux
# =================================================================

echo "========================================"
echo "🚀 LEARNING DISABILITY DETECTION SETUP"
echo "========================================"

# Check Python installation
echo -e "\n[Step 1] Checking Python..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.8 or higher"
    exit 1
fi

python3 --version
echo "✅ Python is available"

# Create virtual environment
echo -e "\n[Step 2] Creating virtual environment..."
python3 -m venv venv
source venv/bin/activate
echo "✅ Virtual environment created and activated"

# Navigate to backend
cd backend

# Install dependencies
echo -e "\n[Step 3] Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
echo "✅ Dependencies installed"

# Train model
echo -e "\n[Step 4] Training ML model..."
echo "This will take 30-60 seconds..."
python train_model.py
echo "✅ Model trained"

# Summary
echo -e "\n========================================"
echo "✅ SETUP COMPLETE!"
echo "========================================"
echo -e "\nNext steps:"
echo "1. Start the API server:"
echo "   python main.py"
echo ""
echo "2. Open API documentation:"
echo "   http://localhost:8000/docs"
echo ""
echo "3. Run tests:"
echo "   python test_api.py"
echo ""
echo "========================================"
