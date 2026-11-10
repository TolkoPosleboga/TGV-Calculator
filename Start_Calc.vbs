Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c cd /d ""C:\Users\PyCharm\Python\TGV"" && venv\Scripts\python.exe main.py", 0, False