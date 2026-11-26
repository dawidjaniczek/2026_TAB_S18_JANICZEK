from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from psycopg.errors import ForeignKeyViolation, InvalidTextRepresentation
from app.db import get_connection

router = APIRouter(prefix="/api", tags=["Contracts"])


class ContractCreate(BaseModel):
    title: str
    template_url: Optional[str] = None
    signed_file_url: Optional[str] = None
    is_signed: bool = False


class ContractUpdate(BaseModel):
    title: Optional[str] = None
    template_url: Optional[str] = None
    signed_file_url: Optional[str] = None
    is_signed: Optional[bool] = None


@router.get("/clients/{client_id}/contracts")
def get_client_contracts(client_id: str):
    sql = """
        SELECT
            cd.id,
            cd.client_id,
            cd.guardian_id,
            CASE
                WHEN g.id IS NOT NULL THEN g.first_name || ' ' || g.last_name
                ELSE NULL
            END AS guardian_name,
            cd.title,
            cd.template_url,
            cd.signed_file_url,
            cd.is_signed,
            cd.generated_at
        FROM contract_documents cd
        LEFT JOIN guardians g ON g.id = cd.guardian_id
        WHERE cd.client_id = %s
        ORDER BY cd.generated_at DESC;
    """
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (client_id,))
                return cur.fetchall()
    except InvalidTextRepresentation:
        raise HTTPException(status_code=400, detail="Nieprawidłowy identyfikator klienta.")


@router.post("/clients/{client_id}/contracts", status_code=201)
def create_client_contract(client_id: str, data: ContractCreate):
    title = data.title.strip()
    if not title:
        raise HTTPException(status_code=400, detail="Tytuł umowy jest wymagany.")

    sql = """
        INSERT INTO contract_documents (client_id, title, template_url, signed_file_url, is_signed)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id, client_id, guardian_id, NULL::text AS guardian_name,
                  title, template_url, signed_file_url, is_signed, generated_at;
    """
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    sql,
                    (
                        client_id,
                        title,
                        data.template_url.strip() if data.template_url else None,
                        data.signed_file_url.strip() if data.signed_file_url else None,
                        data.is_signed,
                    ),
                )
                row = cur.fetchone()
                conn.commit()
                return row
    except ForeignKeyViolation:
        raise HTTPException(status_code=404, detail="Nie znaleziono klienta.")
    except InvalidTextRepresentation:
        raise HTTPException(status_code=400, detail="Nieprawidłowy identyfikator klienta.")


@router.patch("/contracts/{contract_id}")
def update_contract(contract_id: str, data: ContractUpdate):
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, client_id, guardian_id, title, template_url, signed_file_url, is_signed
                    FROM contract_documents
                    WHERE id = %s;
                    """,
                    (contract_id,),
                )
                existing = cur.fetchone()
                if not existing:
                    raise HTTPException(status_code=404, detail="Nie znaleziono umowy.")

                payload = data.model_dump(exclude_unset=True)
                title = (
                    payload["title"].strip()
                    if "title" in payload and payload["title"] is not None
                    else existing["title"]
                )
                if not title:
                    raise HTTPException(status_code=400, detail="Tytuł umowy nie może być pusty.")

                template_url = (
                    (payload["template_url"].strip() or None)
                    if "template_url" in payload and payload["template_url"] is not None
                    else (None if "template_url" in payload else existing["template_url"])
                )
                signed_file_url = (
                    (payload["signed_file_url"].strip() or None)
                    if "signed_file_url" in payload and payload["signed_file_url"] is not None
                    else (None if "signed_file_url" in payload else existing["signed_file_url"])
                )
                is_signed = (
                    payload["is_signed"]
                    if "is_signed" in payload and payload["is_signed"] is not None
                    else existing["is_signed"]
                )

                cur.execute(
                    """
                    UPDATE contract_documents
                    SET title = %s,
                        template_url = %s,
                        signed_file_url = %s,
                        is_signed = %s
                    WHERE id = %s
                    RETURNING id, client_id, guardian_id, title, template_url, signed_file_url, is_signed, generated_at;
                    """,
                    (title, template_url, signed_file_url, is_signed, contract_id),
                )
                row = cur.fetchone()
                conn.commit()
                return row
    except InvalidTextRepresentation:
        raise HTTPException(status_code=400, detail="Nieprawidłowy identyfikator umowy.")


@router.delete("/contracts/{contract_id}")
def delete_contract(contract_id: str):
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM contract_documents WHERE id = %s RETURNING id;",
                    (contract_id,),
                )
                deleted = cur.fetchone()
                if not deleted:
                    raise HTTPException(status_code=404, detail="Nie znaleziono umowy.")
                conn.commit()
                return {"deleted": True, "id": str(deleted["id"])}
    except InvalidTextRepresentation:
        raise HTTPException(status_code=400, detail="Nieprawidłowy identyfikator umowy.")
