import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.routes.auth import router as auth_router
from app.routes.djs import router as djs_router
from app.routes.health import router as health_router
from app.routes.booking import router as bookings_router
from app.routes.club import router as clubs_router
from app.routes.availability import router as availability_router
from app.routes.users import router as users_router
from app.routes import booking_message
from app.routes.stripe_routes import router as stripe_router

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.APP_DEBUG,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=(
        r"https://bass-line.*\.vercel\.app"
        r"|https://.*\.ngrok-free\.app"
        r"|https://.*\.ngrok\.io"
        r"|http://localhost(:\d+)?"
        r"|http://127\.0\.0\.1(:\d+)?"
        r"|https://83eb-2804-7f0-b2c1-d3fd-215c-8a67-9d0b-d0ce.ngrok-free.app"
    ),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve arquivos estáticos de uploads
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(djs_router)
app.include_router(clubs_router)
app.include_router(bookings_router)
app.include_router(availability_router)
app.include_router(booking_message.router)
app.include_router(stripe_router)