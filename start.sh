#!/bin/bash
echo "Starting H&M Campus Server..."
echo ""

# Try Python 3
if command -v python3 &>/dev/null; then
    echo "Open your browser at: http://localhost:8000"
    echo "Press Ctrl+C to stop."
    echo ""
    python3 -m http.server 8000
    exit 0
fi

# Try Python 2
if command -v python &>/dev/null; then
    echo "Open your browser at: http://localhost:8000"
    echo "Press Ctrl+C to stop."
    echo ""
    python -m SimpleHTTPServer 8000
    exit 0
fi

# Try Node / npx
if command -v npx &>/dev/null; then
    echo "Open your browser at: http://localhost:8000"
    echo "Press Ctrl+C to stop."
    echo ""
    npx serve . -p 8000
    exit 0
fi

echo "ERROR: Python or Node.js not found."
echo "Install Python from https://python.org and try again."
exit 1
