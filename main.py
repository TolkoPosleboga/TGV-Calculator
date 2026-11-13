from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from contextlib import asynccontextmanager
import uvicorn
import webbrowser
import threading

from routers import vent_api, heat_api, gas_api, export_api, projects_api, ifc_api, ac_api, balance_api, import_api, natural_smoke_api, vent_extra_api


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Запуск приложения...")
    threading.Timer(1.5, lambda: webbrowser.open("http://127.0.0.1:8000")).start()
    yield
    print("Остановка приложения...")


app = FastAPI(
    title="Инженерный калькулятор",
    description="Проектирование систем ОВ, Газоснабжения и Вентиляции",
    version="1.0.0",
    lifespan=lifespan
)

templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(vent_api.router)
app.include_router(vent_extra_api.router)
app.include_router(heat_api.router)
app.include_router(gas_api.router)
app.include_router(export_api.router)
app.include_router(projects_api.router)
app.include_router(ifc_api.router)
app.include_router(ac_api.router)
app.include_router(balance_api.router)
app.include_router(import_api.router)
app.include_router(natural_smoke_api.router)

@app.get("/")
async def read_index(request: Request):
    return templates.TemplateResponse(request=request, name="index.html")

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)