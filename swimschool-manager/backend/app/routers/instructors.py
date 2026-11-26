from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from psycopg.errors import ForeignKeyViolation, InvalidTextRepresentation, UniqueViolation
from app.db import get_connection

router = APIRouter(prefix="/api/instructors", tags=["Instructors"])


class InstructorCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: str
    password: str = "demo_hash_inst"


class InstructorUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None


@router.get("")
def list_instructors():
    sql = """
        SELECT u.id, u.first_name, u.last_name, u.email, u.phone
        FROM instructors i
        JOIN users u ON u.id = i.id
        ORDER BY u.last_name, u.first_name;
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            return cur.fetchall()


@router.post("", status_code=201)
def create_instructor(data: InstructorCreate):
    password = data.password.strip() or "demo_hash_inst"
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO users (email, password_hash, first_name, last_name, phone)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id, first_name, last_name, email, phone;
                    """,
                    (
                        data.email.strip(),
                        password,
                        data.first_name.strip(),
                        data.last_name.strip(),
                        data.phone.strip(),
                    ),
                )
                user_row = cur.fetchone()
                cur.execute(
                    "INSERT INTO instructors (id) VALUES (%s);",
                    (user_row["id"],),
                )
                conn.commit()
                return user_row
    except UniqueViolation:
        raise HTTPException(
            status_code=409,
            detail="Użytkownik z tym adresem e-mail już istnieje.",
        )


@router.patch("/{instructor_id}")
def update_instructor(instructor_id: str, data: InstructorUpdate):
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.password_hash
                    FROM instructors i
                    JOIN users u ON u.id = i.id
                    WHERE i.id = %s;
                    """,
                    (instructor_id,),
                )
                existing = cur.fetchone()
                if not existing:
                    raise HTTPException(status_code=404, detail="Nie znaleziono instruktora.")

                payload = data.model_dump(exclude_unset=True)
                first_name = (
                    payload["first_name"].strip()
                    if "first_name" in payload and payload["first_name"] is not None
                    else existing["first_name"]
                )
                last_name = (
                    payload["last_name"].strip()
                    if "last_name" in payload and payload["last_name"] is not None
                    else existing["last_name"]
                )
                email = (
                    payload["email"].strip()
                    if "email" in payload and payload["email"] is not None
                    else existing["email"]
                )
                phone = (
                    payload["phone"].strip()
                    if "phone" in payload and payload["phone"] is not None
                    else existing["phone"]
                )
                new_password = payload.get("password")
                password_hash = (
                    new_password.strip()
                    if new_password and new_password.strip()
                    else existing["password_hash"]
                )

                cur.execute(
                    """
                    UPDATE users
                    SET first_name = %s,
                        last_name = %s,
                        email = %s,
                        phone = %s,
                        password_hash = %s
                    WHERE id = %s
                    RETURNING id, first_name, last_name, email, phone;
                    """,
                    (first_name, last_name, email, phone, password_hash, instructor_id),
                )
                row = cur.fetchone()
                conn.commit()
                return row
    except UniqueViolation:
        raise HTTPException(
            status_code=409,
            detail="Użytkownik z tym adresem e-mail już istnieje.",
        )
    except InvalidTextRepresentation:
        raise HTTPException(status_code=400, detail="Nieprawidłowy identyfikator instruktora.")


@router.delete("/{instructor_id}")
def delete_instructor(instructor_id: str):
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id FROM instructors WHERE id = %s;",
                    (instructor_id,),
                )
                if not cur.fetchone():
                    raise HTTPException(status_code=404, detail="Nie znaleziono instruktora.")

                cur.execute(
                    "DELETE FROM users WHERE id = %s RETURNING id;",
                    (instructor_id,),
                )
                deleted = cur.fetchone()
                conn.commit()
                return {"deleted": True, "id": str(deleted["id"])}
    except ForeignKeyViolation:
        raise HTTPException(
            status_code=409,
            detail="Nie można usunąć instruktora, ponieważ ma przypisane zajęcia w harmonogramie.",
        )
    except InvalidTextRepresentation:
        raise HTTPException(status_code=400, detail="Nieprawidłowy identyfikator instruktora.")
