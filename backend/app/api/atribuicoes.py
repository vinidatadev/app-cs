from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user

router = APIRouter()

@router.get("/")
def listar_atribuicoes(
    usuario_id: int = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Lista atribuições"""
    query = """
        SELECT a.id, a.usuario_id, a.titulo, a.descricao, 
               a.prioridade, a.status, u.nome as usuario_nome
        FROM atribuicoes a
        INNER JOIN usuarios u ON u.id = a.usuario_id
        WHERE 1=1
    """
    params = []
    
    if usuario_id:
        query += " AND a.usuario_id = %s"
        params.append(usuario_id)
    
    query += " ORDER BY a.prioridade DESC, a.created_at DESC"
    
    result = db.execute(query, tuple(params))
    atribuicoes = []
    for row in result:
        atribuicoes.append({
            "id": row[0],
            "usuario_id": row[1],
            "titulo": row[2],
            "descricao": row[3],
            "prioridade": row[4],
            "status": row[5],
            "usuario_nome": row[6]
        })
    return atribuicoes

@router.post("/")
def criar_atribuicao(
    usuario_id: int,
    titulo: str,
    descricao: str = None,
    prioridade: str = "media",
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Cria nova atribuição"""
    query = """
        INSERT INTO atribuicoes (usuario_id, titulo, descricao, prioridade, status)
        VALUES (%s, %s, %s, %s, 'pendente')
        RETURNING id
    """
    result = db.execute(query, (usuario_id, titulo, descricao, prioridade))
    db.commit()
    
    atribuicao_id = result.fetchone()[0]
    return {"id": atribuicao_id, "titulo": titulo}
