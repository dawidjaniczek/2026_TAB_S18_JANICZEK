from datetime import date
from typing import Literal, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from psycopg.errors import (
    CheckViolation,
    ForeignKeyViolation,
    InvalidTextRepresentation,
    UniqueViolation,
)
from app.db import get_connection

router = APIRouter(prefix="/api", tags=["Passes & Bookings"])

PassStatus = Literal["ACTIVE", "FROZEN", "EXPIRED", "FINISHED"]


class BookingCreate(BaseModel):
    client_id: str
    lesson_session_id: str
    pass_id: Optional[str] = None


class PassCreate(BaseModel):
    total_lessons: int
    used_lessons: int = 0
    valid_from: date
    valid_until: date
    status: PassStatus = "ACTIVE"


class PassUpdate(BaseModel):
    total_lessons: Optional[int] = None
    used_lessons: Optional[int] = None
    valid_from: Optional[date] = None
    valid_until: Optional[date] = None
    status: Optional[PassStatus] = None


@router.get("/clients/{client_id}/passes")
def get_client_passes(client_id: str):
    sql = """
        SELECT
            id,
            client_id,
            total_lessons,
            used_lessons,
            used_lessons || '/' || total_lessons AS counter,
            valid_from,
            valid_until,
            status
        FROM passes
        WHERE client_id = %s
        ORDER BY valid_until DESC;
    """
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (client_id,))
                return cur.fetchall()
    except InvalidTextRepresentation:
        raise HTTPException(status_code=400, detail="Nieprawidłowy identyfikator klienta.")


@router.post("/clients/{client_id}/passes", status_code=201)
def create_client_pass(client_id: str, data: PassCreate):
    if data.total_lessons <= 0:
        raise HTTPException(status_code=400, detail="Liczba lekcji musi być większa od 0.")
    if data.used_lessons < 0 or data.used_lessons > data.total_lessons:
        raise HTTPException(
            status_code=400,
            detail="Liczba wykorzystanych lekcji musi mieścić się między 0 a łączną liczbą lekcji.",
        )
    if data.valid_until < data.valid_from:
        raise HTTPException(
            status_code=400,
            detail="Data końcowa ważności karnetu nie może być wcześniejsza niż początkowa.",
        )

    sql = """
        INSERT INTO passes (client_id, total_lessons, used_lessons, valid_from, valid_until, status)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING
            id,
            client_id,
            total_lessons,
            used_lessons,
            used_lessons || '/' || total_lessons AS counter,
            valid_from,
            valid_until,
            status;
    """
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    sql,
                    (
                        client_id,
                        data.total_lessons,
                        data.used_lessons,
                        data.valid_from,
                        data.valid_until,
                        data.status,
                    ),
                )
                row = cur.fetchone()
                conn.commit()
                return row
    except ForeignKeyViolation:
        raise HTTPException(status_code=404, detail="Nie znaleziono klienta.")
    except (CheckViolation, InvalidTextRepresentation):
        raise HTTPException(status_code=400, detail="Nieprawidłowe dane karnetu.")


@router.patch("/passes/{pass_id}")
def update_pass(pass_id: str, data: PassUpdate):
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, client_id, total_lessons, used_lessons, valid_from, valid_until, status
                    FROM passes
                    WHERE id = %s;
                    """,
                    (pass_id,),
                )
                existing = cur.fetchone()
                if not existing:
                    raise HTTPException(status_code=404, detail="Nie znaleziono karnetu.")

                payload = data.model_dump(exclude_unset=True)
                total_lessons = (
                    payload["total_lessons"]
                    if "total_lessons" in payload and payload["total_lessons"] is not None
                    else existing["total_lessons"]
                )
                used_lessons = (
                    payload["used_lessons"]
                    if "used_lessons" in payload and payload["used_lessons"] is not None
                    else existing["used_lessons"]
                )
                valid_from = (
                    payload["valid_from"]
                    if "valid_from" in payload and payload["valid_from"] is not None
                    else existing["valid_from"]
                )
                valid_until = (
                    payload["valid_until"]
                    if "valid_until" in payload and payload["valid_until"] is not None
                    else existing["valid_until"]
                )
                status = payload.get("status") or existing["status"]

                if total_lessons <= 0:
                    raise HTTPException(status_code=400, detail="Liczba lekcji musi być większa od 0.")
                if used_lessons < 0 or used_lessons > total_lessons:
                    raise HTTPException(
                        status_code=400,
                        detail="Wykorzystane lekcje muszą mieścić się między 0 a łączną liczbą lekcji.",
                    )
                if valid_until < valid_from:
                    raise HTTPException(
                        status_code=400,
                        detail="Data końcowa ważności nie może być wcześniejsza niż początkowa.",
                    )

                cur.execute(
                    """
                    UPDATE passes
                    SET total_lessons = %s,
                        used_lessons = %s,
                        valid_from = %s,
                        valid_until = %s,
                        status = %s
                    WHERE id = %s
                    RETURNING
                        id,
                        client_id,
                        total_lessons,
                        used_lessons,
                        used_lessons || '/' || total_lessons AS counter,
                        valid_from,
                        valid_until,
                        status;
                    """,
                    (total_lessons, used_lessons, valid_from, valid_until, status, pass_id),
                )
                row = cur.fetchone()
                conn.commit()
                return row
    except (CheckViolation, InvalidTextRepresentation):
        raise HTTPException(status_code=400, detail="Nieprawidłowe dane karnetu.")


@router.delete("/passes/{pass_id}")
def delete_pass(pass_id: str):
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM passes WHERE id = %s RETURNING id;", (pass_id,))
                deleted = cur.fetchone()
                if not deleted:
                    raise HTTPException(status_code=404, detail="Nie znaleziono karnetu.")
                conn.commit()
                return {"deleted": True, "id": str(deleted["id"])}
    except InvalidTextRepresentation:
        raise HTTPException(status_code=400, detail="Nieprawidłowy identyfikator karnetu.")


@router.get("/bookings")
def list_bookings():
    sql = """
        SELECT
            b.id,
            b.status,
            b.booked_at,
            c.first_name || ' ' || c.last_name AS client_name,
            ls.start_time,
            ls.type AS lesson_type,
            COALESCE(p.used_lessons || '/' || p.total_lessons, 'brak') AS pass_counter
        FROM bookings b
        JOIN clients c ON c.id = b.client_id
        JOIN lesson_sessions ls ON ls.id = b.lesson_session_id
        LEFT JOIN passes p ON p.id = b.pass_id
        ORDER BY ls.start_time;
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            return cur.fetchall()


@router.post("/bookings", status_code=201)
def create_booking(booking: BookingCreate):
    sql = """
        INSERT INTO bookings (client_id, lesson_session_id, pass_id)
        VALUES (%s, %s, %s)
        RETURNING id, client_id, lesson_session_id, pass_id, booked_at, status;
    """
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (booking.client_id, booking.lesson_session_id, booking.pass_id))
                row = cur.fetchone()
                conn.commit()
                return row
    except UniqueViolation:
        raise HTTPException(status_code=409, detail="Klient jest już zapisany na te zajęcia")


@router.patch("/bookings/{booking_id}/attend")
def mark_attended(booking_id: str):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, status, pass_id FROM bookings WHERE id = %s FOR UPDATE;",
                (booking_id,),
            )
            booking = cur.fetchone()
            if not booking:
                raise HTTPException(status_code=404, detail="Nie znaleziono rezerwacji")
            if booking["status"] == "ATTENDED":
                raise HTTPException(status_code=400, detail="Obecność została już odnotowana")

            cur.execute(
                "UPDATE bookings SET status = 'ATTENDED' WHERE id = %s;",
                (booking_id,),
            )

            if booking["pass_id"]:
                cur.execute(
                    """
                    UPDATE passes
                    SET used_lessons = used_lessons + 1,
                        status = CASE
                            WHEN used_lessons + 1 >= total_lessons THEN 'FINISHED'::pass_status
                            ELSE status
                        END
                    WHERE id = %s AND used_lessons < total_lessons;
                    """,
                    (booking["pass_id"],),
                )
            conn.commit()
    return {"booking_id": booking_id, "status": "ATTENDED"}
