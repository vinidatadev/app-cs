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
    last_error: Exception | None = None
    for attempt in range(1, 31):
        try:
            for bucket in configured_buckets():
                ensure_bucket(bucket)
            if settings.SEED_ASSETS_ON_START:
                seed_assets()
            return
        except Exception as exc:
            last_error = exc
            logger.warning("MinIO indisponível (tentativa %s/30): %s", attempt, exc)
            time.sleep(2)
    raise RuntimeError(f"Não foi possível inicializar o MinIO: {last_error}")


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


@router.post("/{bucket}/{file_path:path}")
async def upload(
    bucket: str,
    file_path: str,
    file: UploadFile = File(...),
    _user: dict = Depends(require_user),
):
    bucket = validate_bucket(bucket)
    object_name = normalize_object_path(file_path)
    data = await file.read()
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Arquivo maior que 25MB")
    if not data:
        raise HTTPException(status_code=400, detail="Arquivo vazio")

    ensure_bucket(bucket)
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
