import io
import logging
import mimetypes
import re
import time
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from minio import Minio
from minio.error import S3Error

from app.core.config import settings
from app.core.security import require_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/storage", tags=["storage"])

SAFE_BUCKET = re.compile(r"^[a-zA-Z0-9_-]+$")
MAX_UPLOAD_BYTES = 25 * 1024 * 1024

_client: Minio | None = None


def get_client() -> Minio:
    global _client
    if _client is None:
        _client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )
    return _client


def configured_buckets() -> list[str]:
    return [item.strip() for item in settings.MINIO_BUCKETS.split(",") if item.strip()]


def validate_bucket(bucket: str) -> str:
    if not SAFE_BUCKET.match(bucket or "") or bucket not in configured_buckets():
        raise HTTPException(status_code=400, detail="Bucket inválido")
    return bucket


def ensure_bucket(bucket: str) -> None:
    client = get_client()
    if client.bucket_exists(bucket):
        return
    try:
        client.make_bucket(bucket)
    except S3Error as exc:
        if exc.code not in ("BucketAlreadyOwnedByYou", "BucketAlreadyExists"):
            raise


def normalize_object_path(file_path: str) -> str:
    parts = [part for part in (file_path or "").split("/") if part not in ("", ".", "..")]
    if not parts:
        raise HTTPException(status_code=400, detail="Caminho inválido")
    return "/".join(parts)


def ensure_storage() -> None:
    """
    Inicialização lazy do storage.
    Só verifica MinIO se SEED_ASSETS_ON_START=true.
    Caso contrário, a conexão será feita sob demanda nos endpoints.
    """
    buckets = configured_buckets()
    if not buckets or not settings.SEED_ASSETS_ON_START:
        logger.info(
            "Inicialização do MinIO pulada (SEED_ASSETS_ON_START=%s). "
            "Conexão será feita sob demanda nos endpoints de storage.",
            settings.SEED_ASSETS_ON_START
        )
        return
    
    # Se SEED_ASSETS_ON_START=true, tenta conectar e fazer seed
    last_error: Exception | None = None
    for attempt in range(1, 11):  # Reduzido de 30 para 10 tentativas
        try:
            for bucket in buckets:
                ensure_bucket(bucket)
            seed_assets()
            logger.info("MinIO inicializado com sucesso e assets migrados")
            return
        except Exception as exc:
            last_error = exc
            logger.warning("MinIO indisponível (tentativa %s/10): %s", attempt, exc)
            time.sleep(2)
    
    # Não lança exceção, apenas avisa
    logger.warning(
        "Não foi possível conectar ao MinIO no startup: %s. "
        "Os endpoints de storage tentarão conectar sob demanda.",
        last_error
    )


def seed_assets() -> None:
    source = Path(settings.SEED_ASSETS_DIR)
    if not source.is_dir():
        return

    client = get_client()
    for item in source.rglob("*"):
        if not item.is_file():
            continue
        relative = item.relative_to(source)
        if len(relative.parts) < 2:
            continue

        bucket = validate_bucket(relative.parts[0])
        object_name = "/".join(relative.parts[1:])
        ensure_bucket(bucket)

        try:
            client.stat_object(bucket, object_name)
            continue
        except S3Error as exc:
            if exc.code not in ("NoSuchKey", "NoSuchObject", "NoSuchBucket"):
                raise

        content_type = mimetypes.guess_type(item.name)[0] or "application/octet-stream"
        client.fput_object(bucket, object_name, str(item), content_type=content_type)
        logger.info("Arquivo migrado para o MinIO: %s/%s", bucket, object_name)


def storage_health() -> bool:
    try:
        buckets = configured_buckets()
        return bool(buckets) and get_client().bucket_exists(buckets[0])
    except Exception:
        return False


@router.get("/health")
def storage_health_check():
    """
    Endpoint para verificar status do MinIO.
    Retorna informações detalhadas sobre conectividade.
    """
    try:
        buckets = configured_buckets()
        if not buckets:
            return {
                "status": "disabled",
                "message": "Nenhum bucket configurado",
                "buckets": []
            }
        
        client = get_client()
        available_buckets = []
        
        for bucket in buckets:
            try:
                exists = client.bucket_exists(bucket)
                available_buckets.append({
                    "name": bucket,
                    "exists": exists,
                    "accessible": True
                })
            except Exception as e:
                available_buckets.append({
                    "name": bucket,
                    "exists": False,
                    "accessible": False,
                    "error": str(e)
                })
        
        all_accessible = all(b.get("accessible") for b in available_buckets)
        
        return {
            "status": "ok" if all_accessible else "partial",
            "endpoint": settings.MINIO_ENDPOINT,
            "buckets": available_buckets,
            "message": "MinIO acessível" if all_accessible else "Alguns buckets inacessíveis"
        }
    except Exception as exc:
        return {
            "status": "error",
            "endpoint": settings.MINIO_ENDPOINT,
            "message": f"Erro ao conectar: {str(exc)}",
            "buckets": []
        }


@router.post("/{bucket}/{file_path:path}")
async def upload(
    bucket: str,
    file_path: str,
    file: UploadFile = File(...),
    _user: dict = Depends(require_user),
):
    """
    Upload de arquivo para o MinIO.
    Cria o bucket automaticamente se não existir.
    """
    bucket = validate_bucket(bucket)
    object_name = normalize_object_path(file_path)
    data = await file.read()
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Arquivo maior que 25MB")
    if not data:
        raise HTTPException(status_code=400, detail="Arquivo vazio")

    # Garante que o bucket existe (lazy initialization)
    try:
        ensure_bucket(bucket)
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"MinIO indisponível. Verifique se o serviço está rodando: {str(exc)}"
        ) from exc
    
    content_type = file.content_type or mimetypes.guess_type(object_name)[0] or "application/octet-stream"
    try:
        get_client().put_object(
            bucket,
            object_name,
            io.BytesIO(data),
            length=len(data),
            content_type=content_type,
        )
    except S3Error as exc:
        raise HTTPException(status_code=502, detail=f"Falha no MinIO: {exc.code}") from exc

    return {
        "path": object_name,
        "fullPath": f"{bucket}/{object_name}",
        "size": len(data),
        "bucket": bucket,
    }


@router.get("/public/{bucket}/{file_path:path}")
def public_file(bucket: str, file_path: str):
    bucket = validate_bucket(bucket)
    object_name = normalize_object_path(file_path)

    try:
        response = get_client().get_object(bucket, object_name)
    except S3Error as exc:
        if exc.code in ("NoSuchKey", "NoSuchObject", "NoSuchBucket"):
            raise HTTPException(status_code=404, detail="Arquivo não encontrado") from exc
        raise HTTPException(status_code=502, detail=f"Falha no MinIO: {exc.code}") from exc

    media_type = (
        response.headers.get("Content-Type")
        or mimetypes.guess_type(object_name)[0]
        or "application/octet-stream"
    )
    headers = {}
    length = response.headers.get("Content-Length")
    if length:
        headers["Content-Length"] = length

    def iterator():
        try:
            for chunk in response.stream(64 * 1024):
                yield chunk
        finally:
            response.close()
            response.release_conn()

    return StreamingResponse(iterator(), media_type=media_type, headers=headers)
