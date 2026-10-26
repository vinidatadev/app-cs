from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user

router = APIRouter()

@router.get("/")
def listar_indicadores(
    usuario_id: int = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Lista indicadores/KPIs"""
    query = """
        SELECT i.id, i.usuario_id, i.nome, i.tipo, 
               i.valor_atual, i.valor_meta, i.unidade,
               u.nome as usuario_nome
        FROM indicadores i
        INNER JOIN usuarios u ON u.id = i.usuario_id
        WHERE 1=1
    """
    params = []
    
    if usuario_id:
        query += " AND i.usuario_id = %s"
        params.append(usuario_id)
    
    query += " ORDER BY i.created_at DESC"
    
    result = db.execute(query, tuple(params))
    indicadores = []
    for row in result:
        indicadores.append({
            "id": row[0],
            "usuario_id": row[1],
            "nome": row[2],
            "tipo": row[3],
            "valor_atual": float(row[4]) if row[4] else 0,
            "valor_meta": float(row[5]) if row[5] else 0,
            "unidade": row[6],
            "usuario_nome": row[7],
            "percentual": round((float(row[4]) / float(row[5]) * 100), 2) if row[4] and row[5] else 0
        })
    return indicadores

@router.post("/")
def criar_indicador(
    usuario_id: int,
    nome: str,
    tipo: str,
    valor_atual: float = 0,
    valor_meta: float = 100,
    unidade: str = "%",
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Cria novo indicador"""
    query = """
        INSERT INTO indicadores (usuario_id, nome, tipo, valor_atual, valor_meta, unidade)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id
    """
    result = db.execute(query, (usuario_id, nome, tipo, valor_atual, valor_meta, unidade))
    db.commit()
    
    indicador_id = result.fetchone()[0]
    return {"id": indicador_id, "nome": nome}
