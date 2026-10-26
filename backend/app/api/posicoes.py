from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user

router = APIRouter()

@router.get("/")
def listar_posicoes(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Lista todas as posições hierárquicas"""
    query = """
        SELECT p.id, p.titulo, p.posicao_pai_id, p.nivel, p.ordem,
               COUNT(u.id) as total_usuarios
        FROM posicoes p
        LEFT JOIN usuarios u ON u.posicao_id = p.id AND u.deleted_at IS NULL
        GROUP BY p.id
        ORDER BY p.nivel, p.ordem
    """
    result = db.execute(query)
    posicoes = []
    for row in result:
        posicoes.append({
            "id": row[0],
            "titulo": row[1],
            "posicao_pai_id": row[2],
            "nivel": row[3],
            "ordem": row[4],
            "total_usuarios": row[5]
        })
    return posicoes

@router.post("/")
def criar_posicao(
    titulo: str,
    posicao_pai_id: int = None,
    nivel: int = 1,
    ordem: int = 0,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Cria nova posição no organograma"""
    query = """
        INSERT INTO posicoes (titulo, posicao_pai_id, nivel, ordem)
        VALUES (%s, %s, %s, %s)
        RETURNING id
    """
    result = db.execute(query, (titulo, posicao_pai_id, nivel, ordem))
    db.commit()
    
    posicao_id = result.fetchone()[0]
    return {"id": posicao_id, "titulo": titulo}
