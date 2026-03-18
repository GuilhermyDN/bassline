import io
import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.config import settings
from app.models.user import User
from app.schemas.user import UserResponse

router = APIRouter(prefix="/users", tags=["Users"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "avatars")
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE_MB = 8
EXTENSIONS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


def ensure_upload_dir():
    os.makedirs(UPLOAD_DIR, exist_ok=True)


def _remove_background(image_bytes: bytes) -> bytes:
    """
    Remove o fundo da imagem usando rembg.
    Retorna PNG com fundo transparente.
    Importa lazily para não travar o startup caso rembg não esteja instalado.
    """
    try:
        from rembg import remove as rembg_remove
        from PIL import Image

        input_img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
        output_img = rembg_remove(input_img)

        out_buffer = io.BytesIO()
        output_img.save(out_buffer, format="PNG")
        return out_buffer.getvalue()
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Remoção de fundo não disponível. Instale rembg: pip install rembg",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao remover fundo: {str(e)}",
        )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/me/avatar", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    remove_bg: bool = Query(False, description="Remove o fundo da imagem automaticamente"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Faz upload da foto de perfil. Com ?remove_bg=true remove o fundo automaticamente.
    """
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato inválido. Use JPEG, PNG ou WebP.",
        )

    contents = await file.read()
    size_mb = len(contents) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Arquivo muito grande. Máximo {MAX_FILE_SIZE_MB}MB.",
        )

    # Remove fundo se solicitado
    if remove_bg:
        contents = _remove_background(contents)
        ext = ".png"
    else:
        ext = EXTENSIONS[file.content_type]

    ensure_upload_dir()

    # Remove avatar antigo
    if current_user.avatar_url:
        old_filename = current_user.avatar_url.split("/")[-1]
        old_path = os.path.join(UPLOAD_DIR, old_filename)
        if os.path.exists(old_path):
            try:
                os.remove(old_path)
            except OSError:
                pass

    # Salva novo arquivo
    filename = f"user_{current_user.id}_{uuid.uuid4().hex[:8]}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as f:
        f.write(contents)

    current_user.avatar_url = f"{settings.API_BASE_URL}/uploads/avatars/{filename}"
    db.commit()
    db.refresh(current_user)

    return current_user
