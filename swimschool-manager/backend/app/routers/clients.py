from datetime import date
from typing import Literal, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from psycopg.errors import InvalidTextRepresentation
from app.db import get_connection

router = APIRouter(prefix="/api/clients", tags=["Clients"])

SkillLevel = Literal["BEGINNER", "INTERMEDIATE", "ADVANCED"]
ClientStatus = Literal["ACTIVE", "INACTIVE", "SUSPENDED"]


class ClientCreate(BaseModel):
    first_name: str
    last_name: str
    phone: str
    email: Optional[str] = None
    birth_date: Optional[date] = None
    skill_level: SkillLevel = "BEGINNER"
    status: ClientStatus = "ACTIVE"
    notes: Optional[str] = None


class ClientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    birth_date: Optional[date] = None
    skill_level: Optional[SkillLevel] = None
    status: Optional[ClientStatus] = None
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
        INSERT INTO clients (first_name, last_name, email, phone, birth_date, skill_level, status, notes)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id, first_name, last_name, email, phone, birth_date, skill_level, status, notes;
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                sql,
                (
                    client.first_name.strip(),
                    client.last_name.strip(),
                    client.email.strip() if client.email else None,
                    client.phone.strip(),
                    client.birth_date,
                    client.skill_level,
                    client.status,
                    client.notes.strip() if client.notes else None,
                ),
            )
            row = cur.fetchone()
            conn.commit()
            return row


@router.patch("/{client_id}")
def update_client(client_id: str, data: ClientUpdate):
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, first_name, last_name, email, phone, birth_date, skill_level, status, notes
                    FROM clients
                    WHERE id = %s;
                    """,
                    (client_id,),
                )
                existing = cur.fetchone()
                if not existing:
                    raise HTTPException(status_code=404, detail="Nie znaleziono klienta.")

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
                phone = (
                    payload["phone"].strip()
                    if "phone" in payload and payload["phone"] is not None
                    else existing["phone"]
                )
                email = (
                    (payload["email"].strip() or None)
                    if "email" in payload and payload["email"] is not None
                    else (None if "email" in payload else existing["email"])
                )
                birth_date = (
                    payload["birth_date"]
                    if "birth_date" in payload
                    else existing["birth_date"]
                )
                skill_level = payload.get("skill_level") or existing["skill_level"]
                status = payload.get("status") or existing["status"]
                notes = (
                    (payload["notes"].strip() or None)
                    if "notes" in payload and payload["notes"] is not None
                    else (None if "notes" in payload else existing["notes"])
                )

                cur.execute(
                    """
                    UPDATE clients
                    SET first_name = %s,
                        last_name = %s,
                        email = %s,
                        phone = %s,
                        birth_date = %s,
                        skill_level = %s,
                        status = %s,
                        notes = %s
                    WHERE id = %s
                    RETURNING id, first_name, last_name, email, phone, birth_date, skill_level, status, notes;
                    """,
                    (
                        first_name,
                        last_name,
                        email,
                        phone,
                        birth_date,
                        skill_level,
                        status,
                        notes,
                        client_id,
                    ),
                )
                row = cur.fetchone()
                conn.commit()
                return row
    except InvalidTextRepresentation:
        raise HTTPException(status_code=400, detail="Nieprawidłowy identyfikator klienta.")


@router.delete("/{client_id}")
def delete_client(client_id: str):
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM clients WHERE id = %s RETURNING id;",
                    (client_id,),
                )
                deleted = cur.fetchone()
                if not deleted:
                    raise HTTPException(status_code=404, detail="Nie znaleziono klienta.")
                conn.commit()
                return {"deleted": True, "id": str(deleted["id"])}
    except InvalidTextRepresentation:
        raise HTTPException(status_code=400, detail="Nieprawidłowy identyfikator klienta.")
