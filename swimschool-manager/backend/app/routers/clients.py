from datetime import date
from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel
from app.db import get_connection

router = APIRouter(prefix="/api/clients", tags=["Clients"])


class ClientCreate(BaseModel):
    first_name: str
    last_name: str
    phone: str
    email: Optional[str] = None
    birth_date: Optional[date] = None
    skill_level: str = "BEGINNER"
    notes: Optional[str] = None


@router.get("")
def list_clients():
    sql = """
        SELECT id, first_name, last_name, email, phone, birth_date, skill_level, status, notes
        FROM clients
        ORDER BY last_name, first_name;
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            return cur.fetchall()


@router.post("", status_code=201)
def create_client(client: ClientCreate):
    sql = """
        INSERT INTO clients (first_name, last_name, email, phone, birth_date, skill_level, notes)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        RETURNING id, first_name, last_name, email, phone, birth_date, skill_level, status, notes;
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                sql,
                (
                    client.first_name,
                    client.last_name,
                    client.email,
                    client.phone,
                    client.birth_date,
                    client.skill_level,
                    client.notes,
                ),
            )
            row = cur.fetchone()
            conn.commit()
            return row