# service/api.py
from fastapi import FastAPI

# routers
from .router_health import router as health_router
from .router_predict import router as predict_router
from .router_batch import router as batch_router
from .router_admin import router as admin_router  # <-- admin
from .admin_compare import router as admin_compare_router
from .admin_plot import router as admin_plot_router

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Heart Disease ML API",
    version="0.1.0",
    docs_url="/docs",   # <-- enable Swagger UI
    redoc_url="/redoc", # optional ReDoc
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# order doesn’t matter, but keep health first for sanity checks
app.include_router(health_router)
app.include_router(predict_router)
app.include_router(batch_router)
app.include_router(admin_router)
app.include_router(admin_compare_router)
app.include_router(admin_plot_router)
