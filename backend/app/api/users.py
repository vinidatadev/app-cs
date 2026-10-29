"""
Endpoints para gerenciamento de usuários.
Apenas administradores (nivel=2) podem acessar.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from typing import Optional

from app.core.database import get_cursor
from app.core.security import require_user

router = APIRouter(prefix="/api/users", tags=["users"])


class UserCreate(BaseModel):
    """Dados para criar um novo usuário."""
    nome_usuario: str = Field(..., min_length=1, max_length=200)
    cargo: str = Field(..., min_length=1, max_length=200)
    setor: Optional[str] = Field(None, max_length=200)
    nivel: int = Field(1, ge=1, le=2, description="1=usuário comum, 2=admin")
    username: str = Field(..., min_length=3, max_length=50, pattern="^[a-z0-9._-]+$")
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)


class UserUpdate(BaseModel):
    """Dados para atualizar um usuário."""
    nome_usuario: Optional[str] = Field(None, min_length=1, max_length=200)
    cargo: Optional[str] = Field(None, min_length=1, max_length=200)
    setor: Optional[str] = Field(None, max_length=200)
    nivel: Optional[int] = Field(None, ge=1, le=2)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=6, max_length=100)
    is_active: Optional[bool] = None


class PasswordChange(BaseModel):
    """Dados para trocar senha."""
    password: str = Field(..., min_length=6, max_length=100)


def require_admin(current_user: dict = Depends(require_user)) -> dict:
    """Valida que o usuário atual é admin (nivel=2)."""
    if current_user.get("nivel") != 2:
        raise HTTPException(
            status_code=403,
            detail="Acesso negado. Apenas administradores podem gerenciar usuários."
        )
    return current_user


@router.get("")
def list_users(_admin: dict = Depends(require_admin)):
    """
    Lista todos os usuários do sistema.
    Retorna dados do user + app_auth.
    """
    with get_cursor() as cur:
        cur.execute("""
            SELECT 
                u.id,
                u.id_user::text,
                u.nome_usuario,
                u.cargo,
                u.setor,
                u.nivel,
                u.foto,
                u.created_at,
                a.username,
                a.email,
                a.is_active
            FROM public."user" u
            LEFT JOIN public.app_auth a ON a.id_user = u.id_user
            ORDER BY u.nome_usuario
        """)
        rows = cur.fetchall()
        
        return {
            "users": [
                {
                    "id": r["id"],
                    "id_user": r["id_user"],
                    "nome_usuario": r["nome_usuario"],
                    "cargo": r["cargo"],
                    "setor": r["setor"],
                    "nivel": r["nivel"],
                    "foto": r["foto"],
                    "created_at": r["created_at"].isoformat() if r["created_at"] else None,
                    "username": r["username"],
                    "email": r["email"],
                    "is_active": r["is_active"]
                }
                for r in rows
            ]
        }


@router.get("/{user_id}")
def get_user(user_id: int, _admin: dict = Depends(require_admin)):
    """Busca um usuário específico pelo ID."""
    with get_cursor() as cur:
        cur.execute("""
            SELECT 
                u.id,
                u.id_user::text,
                u.nome_usuario,
                u.cargo,
                u.setor,
                u.nivel,
                u.foto,
                u.created_at,
                a.username,
                a.email,
                a.is_active
            FROM public."user" u
            LEFT JOIN public.app_auth a ON a.id_user = u.id_user
            WHERE u.id = %s
        """, (user_id,))
        row = cur.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
        return {
            "id": row["id"],
            "id_user": row["id_user"],
            "nome_usuario": row["nome_usuario"],
            "cargo": row["cargo"],
            "setor": row["setor"],
            "nivel": row["nivel"],
            "foto": row["foto"],
            "created_at": row["created_at"].isoformat() if row["created_at"] else None,
            "username": row["username"],
            "email": row["email"],
            "is_active": row["is_active"]
        }


@router.post("")
def create_user(data: UserCreate, _admin: dict = Depends(require_admin)):
    """
    Cria um novo usuário completo.
    Cria registro em 'user' e 'app_auth'.
    """
    with get_cursor(commit=True) as cur:
        # Verificar se username já existe
        cur.execute(
            "SELECT 1 FROM public.app_auth WHERE lower(username) = lower(%s)",
            (data.username,)
        )
        if cur.fetchone():
            raise HTTPException(
                status_code=400,
                detail=f"Username '{data.username}' já está em uso"
            )
        
        # Verificar se email já existe
        if data.email:
            cur.execute(
                "SELECT 1 FROM public.app_auth WHERE lower(email) = lower(%s)",
                (data.email,)
            )
            if cur.fetchone():
                raise HTTPException(
                    status_code=400,
                    detail=f"Email '{data.email}' já está em uso"
                )
        
        # Criar usuário na tabela 'user'
        cur.execute("""
            INSERT INTO public."user" (nome_usuario, cargo, setor, nivel)
            VALUES (%s, %s, %s, %s)
            RETURNING id, id_user::text
        """, (data.nome_usuario, data.cargo, data.setor, data.nivel))
        user_row = cur.fetchone()
        
        # Criar autenticação na tabela 'app_auth'
        cur.execute("""
            INSERT INTO public.app_auth (id_user, username, email, display_name, password_hash)
            VALUES (%s::uuid, %s, %s, %s, crypt(%s, gen_salt('bf')))
        """, (user_row["id_user"], data.username, data.email, data.nome_usuario, data.password))
        
        return {
            "id": user_row["id"],
            "id_user": user_row["id_user"],
            "message": "Usuário criado com sucesso",
            "username": data.username
        }


@router.put("/{user_id}")
def update_user(user_id: int, data: UserUpdate, admin: dict = Depends(require_admin)):
    """
    Atualiza dados de um usuário.
    Não permite usuário admin alterar seu próprio nível.
    """
    with get_cursor(commit=True) as cur:
        # Buscar usuário atual
        cur.execute('SELECT id_user::text, nivel FROM public."user" WHERE id = %s', (user_id,))
        current = cur.fetchone()
        if not current:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
        # Não permite admin remover próprio nível
        if data.nivel is not None and data.nivel != 2:
            if current["id_user"] == admin.get("id_user"):
                raise HTTPException(
                    status_code=400,
                    detail="Você não pode remover seu próprio nível de administrador"
                )
        
        # Atualizar tabela 'user'
        updates = []
        params = []
        
        if data.nome_usuario is not None:
            updates.append("nome_usuario = %s")
            params.append(data.nome_usuario)
        if data.cargo is not None:
            updates.append("cargo = %s")
            params.append(data.cargo)
        if data.setor is not None:
            updates.append("setor = %s")
            params.append(data.setor)
        if data.nivel is not None:
            updates.append("nivel = %s")
            params.append(data.nivel)
        
        if updates:
            params.append(user_id)
            cur.execute(
                f'UPDATE public."user" SET {", ".join(updates)} WHERE id = %s',
                params
            )
        
        # Atualizar tabela 'app_auth'
        auth_updates = []
        auth_params = []
        
        if data.email is not None:
            # Verificar se email já está em uso
            cur.execute(
                "SELECT 1 FROM public.app_auth WHERE lower(email) = lower(%s) AND id_user != %s::uuid",
                (data.email, current["id_user"])
            )
            if cur.fetchone():
                raise HTTPException(status_code=400, detail=f"Email '{data.email}' já está em uso")
            auth_updates.append("email = %s")
            auth_params.append(data.email)
        
        if data.password is not None:
            auth_updates.append("password_hash = crypt(%s, gen_salt('bf'))")
            auth_params.append(data.password)
        
        if data.is_active is not None:
            # Não permite admin desativar a si mesmo
            if not data.is_active and current["id_user"] == admin.get("id_user"):
                raise HTTPException(
                    status_code=400,
                    detail="Você não pode desativar sua própria conta"
                )
            auth_updates.append("is_active = %s")
            auth_params.append(data.is_active)
        
        if auth_updates:
            auth_params.append(current["id_user"])
            cur.execute(
                f'UPDATE public.app_auth SET {", ".join(auth_updates)} WHERE id_user = %s::uuid',
                auth_params
            )
        
        return {"message": "Usuário atualizado com sucesso"}


@router.delete("/{user_id}")
def delete_user(user_id: int, admin: dict = Depends(require_admin)):
    """
    Deleta um usuário.
    Não permite admin deletar a si mesmo.
    """
    with get_cursor(commit=True) as cur:
        # Buscar usuário
        cur.execute('SELECT id_user::text FROM public."user" WHERE id = %s', (user_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
        # Não permite admin deletar a si mesmo
        if row["id_user"] == admin.get("id_user"):
            raise HTTPException(
                status_code=400,
                detail="Você não pode deletar sua própria conta"
            )
        
        # Deletar (CASCADE vai remover app_auth automaticamente)
        cur.execute('DELETE FROM public."user" WHERE id = %s', (user_id,))
        
        return {"message": "Usuário deletado com sucesso"}


@router.post("/{user_id}/password")
def change_user_password(
    user_id: int,
    data: PasswordChange,
    _admin: dict = Depends(require_admin)
):
    """Permite admin trocar senha de qualquer usuário."""
    with get_cursor(commit=True) as cur:
        # Verificar se usuário existe
        cur.execute('SELECT id_user::text FROM public."user" WHERE id = %s', (user_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
        # Atualizar senha
        cur.execute("""
            UPDATE public.app_auth
            SET password_hash = crypt(%s, gen_salt('bf'))
            WHERE id_user = %s::uuid
        """, (data.password, row["id_user"]))
        
        return {"message": "Senha alterada com sucesso"}


@router.post("/{user_id}/activate")
def activate_user(user_id: int, _admin: dict = Depends(require_admin)):
    """Ativa um usuário desativado."""
    with get_cursor(commit=True) as cur:
        cur.execute('SELECT id_user::text FROM public."user" WHERE id = %s', (user_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
        cur.execute(
            'UPDATE public.app_auth SET is_active = true WHERE id_user = %s::uuid',
            (row["id_user"],)
        )
        return {"message": "Usuário ativado com sucesso"}


@router.post("/{user_id}/deactivate")
def deactivate_user(user_id: int, admin: dict = Depends(require_admin)):
    """Desativa um usuário."""
    with get_cursor(commit=True) as cur:
        cur.execute('SELECT id_user::text FROM public."user" WHERE id = %s', (user_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
        # Não permite desativar a si mesmo
        if row["id_user"] == admin.get("id_user"):
            raise HTTPException(
                status_code=400,
                detail="Você não pode desativar sua própria conta"
            )
        
        cur.execute(
            'UPDATE public.app_auth SET is_active = false WHERE id_user = %s::uuid',
            (row["id_user"],)
        )
        return {"message": "Usuário desativado com sucesso"}
