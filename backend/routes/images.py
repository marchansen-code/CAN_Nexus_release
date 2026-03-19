"""
Image upload routes for the CANUSA Knowledge Hub API.
"""
from fastapi import APIRouter, HTTPException, Depends, File, UploadFile
from fastapi.responses import Response
from typing import List, Optional
from datetime import datetime, timezone
import uuid
import os

from database import db
from models import User
from dependencies import get_current_user

router = APIRouter(prefix="/images", tags=["Images"])


async def ensure_images_folder(user_id: str) -> str:
    """Ensure the 'Bilder' folder exists and return its folder_id."""
    images_folder = await db.document_folders.find_one({"name": "Bilder", "parent_id": None})
    if not images_folder:
        folder_id = f"dfolder_{uuid.uuid4().hex[:12]}"
        folder_doc = {
            "folder_id": folder_id,
            "name": "Bilder",
            "parent_id": None,
            "description": "Automatisch erstellter Ordner für hochgeladene Bilder",
            "order": 0,
            "created_by": user_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.document_folders.insert_one(folder_doc)
        return folder_id
    return images_folder["folder_id"]


@router.post("/upload")
async def upload_image(file: UploadFile = File(...), user: User = Depends(get_current_user)):
    """Upload an image for use in articles."""
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Nur Bilder sind erlaubt (JPEG, PNG, GIF, WebP)")
    
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Bild darf maximal 10MB groß sein")
    
    images_dir = "/tmp/images"
    os.makedirs(images_dir, exist_ok=True)
    
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    image_id = f"img_{uuid.uuid4().hex[:12]}"
    filename = f"{image_id}.{ext}"
    file_path = f"{images_dir}/{filename}"
    
    with open(file_path, "wb") as f:
        f.write(content)
    
    image_doc = {
        "image_id": image_id,
        "filename": filename,
        "original_filename": file.filename,
        "content_type": file.content_type,
        "size": len(content),
        "file_path": file_path,
        "uploaded_by": user.user_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.images.insert_one(image_doc)
    
    return {
        "image_id": image_id,
        "url": f"/api/images/{image_id}",
        "filename": file.filename
    }


@router.post("/upload-multiple")
async def upload_multiple_images(
    files: List[UploadFile] = File(...),
    save_to_documents: bool = True,
    folder_id: Optional[str] = None,
    user: User = Depends(get_current_user)
):
    """Upload multiple images at once, optionally saving them to a document folder."""
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    results = []
    errors = []
    
    # Get or create images folder if saving to documents and no specific folder given
    target_folder_id = folder_id
    if save_to_documents and not folder_id:
        target_folder_id = await ensure_images_folder(user.user_id)
    
    images_dir = "/tmp/images"
    os.makedirs(images_dir, exist_ok=True)
    
    for file in files:
        try:
            if file.content_type not in allowed_types:
                errors.append({"filename": file.filename, "error": "Ungültiger Dateityp"})
                continue
            
            content = await file.read()
            if len(content) > 10 * 1024 * 1024:
                errors.append({"filename": file.filename, "error": "Datei zu groß (max 10MB)"})
                continue
            
            ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
            image_id = f"img_{uuid.uuid4().hex[:12]}"
            filename = f"{image_id}.{ext}"
            file_path = f"{images_dir}/{filename}"
            
            with open(file_path, "wb") as f:
                f.write(content)
            
            # Save to images collection
            image_doc = {
                "image_id": image_id,
                "filename": filename,
                "original_filename": file.filename,
                "content_type": file.content_type,
                "size": len(content),
                "file_path": file_path,
                "uploaded_by": user.user_id,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.images.insert_one(image_doc)
            
            # Also save as a document if requested
            if save_to_documents and target_folder_id:
                doc_id = f"doc_{uuid.uuid4().hex[:12]}"
                document_doc = {
                    "document_id": doc_id,
                    "title": file.filename,
                    "description": "",
                    "file_type": ext.lower(),
                    "file_size": len(content),
                    "file_path": file_path,
                    "folder_id": target_folder_id,
                    "status": "active",
                    "uploaded_by": user.user_id,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                    "is_image": True,
                    "image_id": image_id
                }
                await db.documents.insert_one(document_doc)
            
            results.append({
                "image_id": image_id,
                "url": f"/api/images/{image_id}",
                "filename": file.filename,
                "size": len(content)
            })
            
        except Exception as e:
            errors.append({"filename": file.filename, "error": str(e)})
    
    return {
        "uploaded": results,
        "errors": errors,
        "total": len(files),
        "success_count": len(results),
        "error_count": len(errors),
        "folder_id": target_folder_id
    }


@router.get("/{image_id}")
async def get_image(image_id: str):
    """Serve an uploaded image."""
    image_doc = await db.images.find_one({"image_id": image_id})
    if not image_doc:
        raise HTTPException(status_code=404, detail="Bild nicht gefunden")
    
    file_path = image_doc.get("file_path")
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Bilddatei nicht gefunden")
    
    with open(file_path, "rb") as f:
        content = f.read()
    
    return Response(
        content=content,
        media_type=image_doc.get("content_type", "image/jpeg"),
        headers={
            "Cache-Control": "public, max-age=31536000",
            "Content-Disposition": f"inline; filename=\"{image_doc.get('original_filename', 'image')}\""
        }
    )
