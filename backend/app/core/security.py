from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.core.config import settings
from app.core.database import get_cursor

bearer = HTTPBearer(auto_error=False)


def create_access_token(subject: str, email: str | None = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": subject, "role": "organograma_api", "exp": expire}
    if email:
        payload["email"] = email
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


def require_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> dict:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autenticação obrigatória",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_access_token(credentials.credentials)
    subject = payload.get("sub")
    if not subject:
        raise HTTPException(status_code=401, detail="Token sem usuário")
    with get_cursor() as cur:
        cur.execute(
            """
            SELECT a.id_user::text AS id, a.email, a.username, a.display_name,
                   u.nome_usuario, u.cargo, u.nivel, u.setor, u.foto
            FROM public.app_auth a
            JOIN public."user" u ON u.id_user = a.id_user
            WHERE a.id_user = %s::uuid AND a.is_active
            LIMIT 1
            """,
            (subject,),
        )
        user = cur.fetchone()
    if not user:
        raise HTTPException(status_code=401, detail="Usuário inativo ou removido")
    return dict(user)
