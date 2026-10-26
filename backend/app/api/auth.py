from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.config import settings
from app.core.database import get_cursor
from app.core.security import create_access_token, require_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginBody(BaseModel):
    login: str | None = None
    email: str | None = None
    password: str


def public_user(row: dict) -> dict:
    return {
        "id": row["id_user"],
        "email": row.get("email"),
        "username": row.get("username"),
        "name": row.get("display_name") or row.get("nome_usuario"),
        "nome_usuario": row.get("nome_usuario"),
        "cargo": row.get("cargo"),
        "nivel": row.get("nivel"),
        "setor": row.get("setor"),
        "foto": row.get("foto"),
    }


@router.post("/login")
def login(body: LoginBody):
    identifier = (body.login or body.email or "").strip()
    if not identifier or not body.password:
        raise HTTPException(status_code=400, detail="Informe usuário/e-mail e senha")

    with get_cursor() as cur:
        cur.execute(
            """
            SELECT a.id_user::text AS id_user, a.username, a.email, a.display_name,
                   u.nome_usuario, u.cargo, u.nivel, u.setor, u.foto
            FROM public.app_auth a
            JOIN public."user" u ON u.id_user = a.id_user
            WHERE a.is_active
              AND (
                lower(a.email) = lower(trim(%s))
                OR lower(a.username) = lower(trim(%s))
                OR regexp_replace(lower(a.display_name), '^\s+|\s+$', '', 'g') = lower(%s)
              )
              AND a.password_hash = crypt(%s, a.password_hash)
            ORDER BY CASE WHEN lower(a.email) = lower(%s) THEN 0 ELSE 1 END, a.id
            LIMIT 1
            """,
            (identifier, identifier, identifier, body.password, identifier),
        )
        row = cur.fetchone()

    if not row:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    token = create_access_token(row["id_user"], row.get("email"))
    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": public_user(dict(row)),
    }


@router.get("/me")
def me(user: dict = Depends(require_user)):
    return {
        "user": {
            "id": user["id"],
            "email": user.get("email"),
            "username": user.get("username"),
            "name": user.get("display_name") or user.get("nome_usuario"),
        }
    }


@router.post("/logout")
def logout():
    return {"ok": True}
