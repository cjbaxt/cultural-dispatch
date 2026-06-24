import uuid
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

router = APIRouter()

IMAGES_DIR = Path(__file__).parent.parent.parent.parent / "frontend" / "public" / "images"
ALLOWED = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/api/upload")
async def upload_image(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED:
        raise HTTPException(400, f"Unsupported file type: {file.content_type}")

    data = await file.read()
    if len(data) > MAX_SIZE:
        raise HTTPException(400, "File too large (max 10 MB)")

    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    (IMAGES_DIR / filename).write_bytes(data)

    return JSONResponse({"url": f"/images/{filename}"})
