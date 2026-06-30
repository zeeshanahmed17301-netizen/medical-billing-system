@echo off
title MedBill - Stopping...
echo Stopping MedBill servers...
taskkill /f /im uvicorn.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
echo All servers stopped.
pause
