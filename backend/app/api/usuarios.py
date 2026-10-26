from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from typing import List

router = APIRouter()

@router.get("/")
def listar_usuarios(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Lista todos os usuários"""
    # Query SQL direta (sem ORM por simplicidade)
    query = """
        SELECT id, nome, email, cargo, posicao_id, avatar_url, created_at
        FROM usuarios
        WHERE deleted_at IS NULL
        ORDER BY nome
        LIMIT %s OFFSET %s
    """
    result = db.execute(query, (limit, skip))
    usuarios = []
    for row in result:
        usuarios.append({
            "id": row[0],
            "nome": row[1],
            "email": row[2],
            "cargo": row[3],
            "posicao_id": row[4],
            "avatar_url": row[5],
            "created_at": str(row[6]) if row[6] else None
        })
    return usuarios

@router.get("/{usuario_id}")
def buscar_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Busca usuário específico"""
    query = """
        SELECT id, nome, email, cargo, posicao_id, avatar_url
        FROM usuarios
        WHERE id = %s AND deleted_at IS NULL
    """
    result = db.execute(query, (usuario_id,)).fetchone()
    
    if not result:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    return {
        "id": result[0],
        "nome": result[1],
        "email": result[2],
        "cargo": result[3],
        "posicao_id": result[4],
        "avatar_url": result[5]
    }

@router.post("/")
def criar_usuario(
    nome: str,
    email: str,
    cargo: str = None,
    posicao_id: int = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Cria novo usuário"""
    query = """
        INSERT INTO usuarios (nome, email, cargo, posicao_id)
        VALUES (%s, %s, %s, %s)
        RETURNING id
    """
    result = db.execute(query, (nome, email, cargo, posicao_id))
    db.commit()
    
    usuario_id = result.fetchone()[0]
    return {"id": usuario_id, "nome": nome, "email": email}

@router.put("/{usuario_id}")
def atualizar_usuario(
    usuario_id: int,
    nome: str = None,
    cargo: str = None,
    posicao_id: int = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Atualiza usuário"""
    updates = []
    params = []
    
    if nome:
        updates.append("nome = %s")
        params.append(nome)
    if cargo:
        updates.append("cargo = %s")
        params.append(cargo)
    if posicao_id:
        updates.append("posicao_id = %s")
        params.append(posicao_id)
    
    if not updates:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar")
    
    params.append(usuario_id)
    query = f"UPDATE usuarios SET {', '.join(updates)} WHERE id = %s"
    db.execute(query, tuple(params))
    db.commit()
    
    return {"message": "Usuário atualizado"}

@router.delete("/{usuario_id}")
def deletar_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Remove usuário (soft delete)"""
    query = "UPDATE usuarios SET deleted_at = NOW() WHERE id = %s"
    db.execute(query, (usuario_id,))
    db.commit()
    return {"message": "Usuário removido"}
