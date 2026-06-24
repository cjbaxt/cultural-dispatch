import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import text
from app.db import engine, create_db_and_tables
from app.api.posts import router as posts_router
from app.api.publish import router as publish_router
from app.api.upload import router as upload_router

app = FastAPI(title="Claire Blog", version="0.1.0")

_cors_origins = os.environ.get(
    "CORS_ORIGINS",
    "http://localhost:4321,http://127.0.0.1:4321,http://localhost:4322,http://localhost:4323,http://localhost:4324,http://localhost:4325",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(posts_router)
app.include_router(publish_router)
app.include_router(upload_router)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


@app.get("/health")
def health():
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    return {"status": "ok"}
