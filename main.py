from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from contextlib import asynccontextmanager
from db.database import init_db

from routers import (
    vent_api, heat_api, gas_api, ac_api, balance_api,
    natural_smoke_api, export_api, projects_api, ifc_api,
    import_api, vent_extra_api, bom_api, spec_export_api, analytics_api
)

import uvicorn

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(title="Инженерный калькулятор", lifespan=lifespan)

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

app.include_router(vent_api.router)
app.include_router(heat_api.router)
app.include_router(gas_api.router)
app.include_router(ac_api.router)
app.include_router(balance_api.router)
app.include_router(natural_smoke_api.router)
app.include_router(export_api.router)
app.include_router(projects_api.router)
app.include_router(ifc_api.router)
app.include_router(import_api.router)
app.include_router(vent_extra_api.router)
app.include_router(bom_api.router)
app.include_router(spec_export_api.router)
app.include_router(analytics_api.router)

@app.get("/")
async def read_root(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={"request": request}
    )

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)