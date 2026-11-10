# main.py
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from routers import vent_api, heat_api, gas_api, export_api
import webbrowser
import threading
import uvicorn

app = FastAPI(title="Инженерный калькулятор", version="6.0.0")

# Подключаем статику (CSS, JS)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Подключаем API роутеры
app.include_router(vent_api.router)
app.include_router(heat_api.router)
app.include_router(gas_api.router)
app.include_router(export_api.router)

@app.get("/")
async def index():
    """Отдаёт главную страницу."""
    return FileResponse("templates/index.html")

def open_browser():
    webbrowser.open("http://127.0.0.1:8000")

if __name__ == "__main__":
    threading.Timer(1.5, open_browser).start()
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)