@echo off
echo ==========================================================
echo Starting Resume Analyzer Local Server...
echo ==========================================================
echo.
echo Your browser will open automatically.
echo Keep this window open while you use the app!
echo.
start http://localhost:3000
python -m pip install -r requirements.txt
python server.py
pause
