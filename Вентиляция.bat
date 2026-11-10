@echo off
chcp 65001 >nul
cd /d "%~dp0"
start /min "" venv\Scripts\python.exe main.py
exit