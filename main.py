import webbrowser
import threading
from contextlib import asynccontextmanager
import uvicorn
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from db.database import init_db
from routers import vent_api, heat_api, gas_api, export_api, projects_api, ifc_api

# Новый современный обработчик старта приложения
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Этот код выполняется при запуске сервера
    init_db()
    yield
    # Этот код выполнился бы при выключении сервера (пока не нужен)

app = FastAPI(
    title="Инженерный калькулятор",
    version="6.0.0",
    lifespan=lifespan  # Подключаем наш новый обработчик
)

# Подключаем статику (CSS, JS, справочники)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Подключаем API роутеры
app.include_router(vent_api.router)
app.include_router(heat_api.router)
app.include_router(gas_api.router)
app.include_router(export_api.router)
app.include_router(projects_api.router)
app.include_router(ifc_api.router)

@app.get("/")
async def index():
    """Отдаёт главную страницу."""
    return FileResponse("templates/index.html")

def open_browser():
    webbrowser.open("http://127.0.0.1:8000")

if __name__ == "__main__":
    threading.Timer(1.5, open_browser).start()
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)