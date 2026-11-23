from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from psycopg.errors import UniqueViolation
from app.db import get_connection

router = APIRouter(prefix="/api", tags=["Passes & Bookings"])


class BookingCreate(BaseModel):
    client_id: str
    lesson_session_id: str
    pass_id: Optional[str] = None


@router.get("/clients/{client_id}/passes")
def get_client_passes(client_id: str):
    sql = """
        SELECT
            id,
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
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (client_id,))
            return cur.fetchall()


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