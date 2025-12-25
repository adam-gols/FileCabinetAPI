#!/bin/bash

# Simple server startup script for GOLS OBS Widget
echo "🚀 Starting GOLS OBS Widget server..."
echo "📍 Widget will be available at: http://localhost:8000"
echo "🎮 For OBS: Use http://localhost:8000 as Browser Source URL"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start Python HTTP server
python3 -m http.server 8000
