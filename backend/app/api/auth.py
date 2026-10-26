from fastapi import APIRouter, HTTPException
from app.core.config import settings
from app.core.security import create_access_token
import httpx

router = APIRouter()

@router.get("/login")
async def login():
    """Retorna URL para login Microsoft"""
    if not settings.AZURE_CLIENT_ID:
        raise HTTPException(status_code=501, detail="Azure AD não configurado")
    
    auth_url = (
        f"https://login.microsoftonline.com/{settings.AZURE_TENANT_ID}/oauth2/v2.0/authorize"
        f"?client_id={settings.AZURE_CLIENT_ID}"
        f"&response_type=code"
        f"&redirect_uri={settings.AZURE_REDIRECT_URI}"
        f"&scope=openid email profile"
    )
    
    return {"auth_url": auth_url}

@router.get("/callback")
async def callback(code: str):
    """Callback do Azure AD"""
    if not settings.AZURE_CLIENT_ID:
        raise HTTPException(status_code=501, detail="Azure AD não configurado")
    
    # Trocar code por token
    token_url = f"https://login.microsoftonline.com/{settings.AZURE_TENANT_ID}/oauth2/v2.0/token"
    
    data = {
        "client_id": settings.AZURE_CLIENT_ID,
        "client_secret": settings.AZURE_CLIENT_SECRET,
        "code": code,
        "redirect_uri": settings.AZURE_REDIRECT_URI,
        "grant_type": "authorization_code"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(token_url, data=data)
        
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Erro no login Microsoft")
        
        token_data = response.json()
        access_token = token_data.get("access_token")
        
        # Buscar dados do usuário
        graph_response = await client.get(
            "https://graph.microsoft.com/v1.0/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        if graph_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Erro ao buscar dados do usuário")
        
        user_data = graph_response.json()
        
        # Criar JWT
        jwt_token = create_access_token({
            "sub": user_data.get("id"),
            "email": user_data.get("mail") or user_data.get("userPrincipalName"),
            "nome": user_data.get("displayName")
        })
        
        return {
            "access_token": jwt_token,
            "token_type": "bearer",
            "user": {
                "email": user_data.get("mail") or user_data.get("userPrincipalName"),
                "nome": user_data.get("displayName")
            }
        }

@router.post("/login/basic")
async def login_basic(email: str, password: str):
    """Login básico (fallback sem Azure)"""
    # TODO: Implementar validação no banco
    # Por enquanto, login de teste
    if email == "admin@empresa.com" and password == "admin123":
        token = create_access_token({"sub": "1", "email": email})
        return {"access_token": token, "token_type": "bearer"}
    
    raise HTTPException(status_code=401, detail="Credenciais inválidas")
