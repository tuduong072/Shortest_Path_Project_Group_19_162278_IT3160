#!/bin/bash

echo "=========================================="
echo "  Routing System - Hoàng Liệt"
echo "=========================================="
echo ""

if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed"
    exit 1
fi

if ! command -v pip3 &> /dev/null && ! command -v pip &> /dev/null; then
    echo "Error: pip is not installed"
    exit 1
fi

echo "Checking dependencies..."
pip3 install -r requirements.txt 2>/dev/null || pip install -r requirements.txt



echo ""
echo "Checking database..."
if [ -f "../data/nodes.csv" ] && [ -f "../data/edges.csv" ]; then
    read -p "Import data from CSV files? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        python3 import_data.py || python import_data.py
    fi
fi

echo ""
echo "Starting Flask server..."
echo "User interface: http://localhost:5000"
echo "Admin interface: http://localhost:5000/admin"
echo ""
echo "Press Ctrl+C to stop"
echo ""

python3 app.py || python app.py
