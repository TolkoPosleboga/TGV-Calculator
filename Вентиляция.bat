@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Запуск инженерного калькулятора...
venv\Scripts\python.exe main.py
pause