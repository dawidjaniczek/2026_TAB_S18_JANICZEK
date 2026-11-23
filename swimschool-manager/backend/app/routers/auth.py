from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.db import get_connection

router = APIRouter(prefix="/api/auth", tags=["Auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login")
def login(data: LoginRequest):
    sql = """
        SELECT
            u.id,
            u.email,
            u.password_hash,
            u.first_name,
            u.last_name,
            CASE
                WHEN sm.staff_role IS NOT NULL THEN sm.staff_role::text
                WHEN i.id IS NOT NULL THEN 'INSTRUCTOR'
                ELSE 'USER'
            END AS role
        FROM users u
        LEFT JOIN staff_members sm ON sm.id = u.id
        LEFT JOIN instructors i ON i.id = u.id
        WHERE u.email = %s;
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (data.email,))
            user = cur.fetchone()

    if not user or user["password_hash"] != data.password:
        raise HTTPException(status_code=401, detail="Nieprawidłowy email lub hasło")

    return {
        "id": str(user["id"]),
        "email": user["email"],
        "first_name": user["first_name"],
        "last_name": user["last_name"],
        "role": user["role"],
    }