from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.auth import router as auth_router
from app.api.storage import ensure_storage, router as storage_router, storage_health
from app.api.users import router as users_router
from app.core.config import settings
from app.core.database import get_cursor

app = FastAPI(
    title="Organograma API Local",
    version="2.0.0",
    description="Autenticação e armazenamento local do Organograma (Postgres + PostgREST).",
)

origins = [item.strip() for item in settings.CORS_ORIGINS.split(",") if item.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(storage_router)
app.include_router(users_router)


def ensure_admin_account() -> None:
    with get_cursor(commit=True) as cur:
        cur.execute(
            'SELECT id_user::text AS id_user FROM public."user" ORDER BY (nivel = 2) DESC, id LIMIT 1'
        )
        row = cur.fetchone()
        if row is None:
            cur.execute(
                """
                INSERT INTO public."user" (nome_usuario, cargo, nivel, setor)
                VALUES ('Administrador', 'Administrador', 2, NULL)
                RETURNING id_user::text AS id_user
                """
            )
            row = cur.fetchone()

        cur.execute(
            """
            INSERT INTO public.app_auth (id_user, username, email, display_name, password_hash)
            VALUES (%s::uuid, 'admin', %s, 'Administrador', crypt(%s, gen_salt('bf')))
            ON CONFLICT (username) DO UPDATE
              SET id_user = EXCLUDED.id_user,
                  email = EXCLUDED.email,
                  display_name = EXCLUDED.display_name,
                  password_hash = EXCLUDED.password_hash,
                  is_active = true
            """,
            (row["id_user"], settings.ADMIN_EMAIL, settings.ADMIN_PASSWORD),
        )


@app.on_event("startup")
def startup() -> None:
    ensure_admin_account()
    ensure_storage()


@app.get("/health")
def health():
    try:
        with get_cursor() as cur:
            cur.execute("SELECT 1 AS ok")
            cur.fetchone()
        return {"status": "ok", "database": True, "storage": storage_health()}
    except Exception as exc:
        return JSONResponse(
            status_code=503,
            content={"status": "error", "database": False, "detail": str(exc)},
        )


@app.get("/")
def root():
    return {"service": "organograma-api", "docs": "/docs", "health": "/health"}
