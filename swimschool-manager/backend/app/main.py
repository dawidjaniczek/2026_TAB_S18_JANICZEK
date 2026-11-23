from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db import get_connection
from app.routers import auth, clients, schedule, bookings

app = FastAPI(title="SwimSchool Manager API")

# Pozwala frontendowi (React + Vite na porcie 5173) łączyć się z API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(clients.router)
app.include_router(schedule.router)
app.include_router(bookings.router)


@app.get("/api/health", tags=["System"])
def health_check():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT 1 AS ok;")
            cur.fetchone()
    return {"status": "ok", "database": "connected"}