#!/bin/bash
echo "Stopping MedBill..."
pkill -f "uvicorn app.main:app" 2>/dev/null
pkill -f "vite" 2>/dev/null
echo "All servers stopped."
