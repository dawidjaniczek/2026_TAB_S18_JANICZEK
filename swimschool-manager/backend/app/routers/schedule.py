from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.db import get_connection

router = APIRouter(prefix="/api", tags=["Schedule & Groups"])


class SessionCreate(BaseModel):
    instructor_id: str
    facility_id: str
    swim_group_id: Optional[str] = None
    start_time: datetime
    duration_minutes: int = 45
    type: str  # INDIVIDUAL, SEMI_INDIVIDUAL, GROUP, AQUAAEROBICS, SPECIAL_EVENT


@router.get("/facilities")
def list_facilities():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id, name, address, city FROM facilities ORDER BY name;")
            return cur.fetchall()


@router.get("/instructors")
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


@router.get("/groups")
def list_groups():
    sql = """
        SELECT id, name, target_skill_level, min_age, max_age, max_participants
        FROM swim_groups
        ORDER BY name;
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            return cur.fetchall()


@router.get("/sessions")
def list_sessions():
    sql = """
        SELECT
            ls.id,
            ls.start_time,
            ls.duration_minutes,
            ls.type,
            ls.is_cancelled,
            f.name AS facility_name,
            u.first_name || ' ' || u.last_name AS instructor_name,
            sg.name AS group_name
        FROM lesson_sessions ls
        JOIN facilities f ON f.id = ls.facility_id
        JOIN users u ON u.id = ls.instructor_id
        LEFT JOIN swim_groups sg ON sg.id = ls.swim_group_id
        ORDER BY ls.start_time;
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            return cur.fetchall()


@router.post("/sessions", status_code=201)
def create_session(session: SessionCreate):
    # Weryfikacja konfliktu: czy ten sam instruktor nie ma już zajęć w tym oknie czasowym
    conflict_sql = """
        SELECT 1
        FROM lesson_sessions
        WHERE instructor_id = %s
          AND is_cancelled = FALSE
          AND start_time < (%s + (%s * INTERVAL '1 minute'))
          AND (start_time + (duration_minutes * INTERVAL '1 minute')) > %s
        LIMIT 1;
    """
    insert_sql = """
        INSERT INTO lesson_sessions (instructor_id, facility_id, swim_group_id, start_time, duration_minutes, type)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id, instructor_id, facility_id, swim_group_id, start_time, duration_minutes, type, is_cancelled;
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                conflict_sql,
                (session.instructor_id, session.start_time, session.duration_minutes, session.start_time),
            )
            if cur.fetchone():
                raise HTTPException(
                    status_code=409,
                    detail="Konflikt grafiku: instruktor ma już zaplanowane zajęcia w tym terminie",
                )
            cur.execute(
                insert_sql,
                (
                    session.instructor_id,
                    session.facility_id,
                    session.swim_group_id,
                    session.start_time,
                    session.duration_minutes,
                    session.type,
                ),
            )
            row = cur.fetchone()
            conn.commit()
            return row