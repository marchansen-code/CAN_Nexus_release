"""
OCR Routes - Text extraction from scanned documents
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import Dict, Optional
import logging

from dependencies import get_current_user
from models import User
from services.ocr_service import ocr_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ocr", tags=["OCR"])


@router.get("/status")
async def get_ocr_status(user: User = Depends(get_current_user)):
    """Check if OCR service is available."""
    return {
        "available": ocr_service.is_available(),
        "provider": "Tesseract OCR (Kostenlos)" if ocr_service.is_available() else None,
        "languages": ["Deutsch", "Englisch"],
        "message": "OCR ist verfügbar (Tesseract)" if ocr_service.is_available() else "OCR ist nicht verfügbar. Tesseract ist nicht installiert."
    }


@router.post("/extract-text")
async def extract_text_from_document(
    file: UploadFile = File(...),
    dpi: int = 200,
    first_page: Optional[int] = None,
    last_page: Optional[int] = None,
    user: User = Depends(get_current_user)
) -> Dict:
    """
    Extract text from a scanned PDF or image using OCR.
    
    Args:
        file: PDF or image file
        dpi: Resolution for PDF conversion (150-300 recommended)
        first_page: First page to process (for PDFs, 1-indexed)
        last_page: Last page to process (for PDFs, inclusive)
    
    Returns:
        Extracted text with confidence score and metadata
    """
    if not ocr_service.is_available():
        raise HTTPException(
            status_code=503,
            detail="OCR-Dienst ist nicht verfügbar. Bitte Google Cloud Vision Credentials konfigurieren."
        )
    
    # Validate file type
    allowed_types = [
        "application/pdf", 
        "application/x-pdf",
        "image/jpeg",
        "image/png",
        "image/tiff",
        "image/bmp"
    ]
    
    content_type = file.content_type or ""
    if content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Nicht unterstützter Dateityp: {content_type}. Erlaubt sind: PDF, JPEG, PNG, TIFF, BMP"
        )
    
    # Validate DPI
    if dpi < 100 or dpi > 400:
        raise HTTPException(
            status_code=400,
            detail="DPI muss zwischen 100 und 400 liegen"
        )
    
    try:
        # Read file content
        file_bytes = await file.read()
        
        if not file_bytes:
            raise HTTPException(
                status_code=400,
                detail="Datei ist leer"
            )
        
        logger.info(f"Processing OCR for file: {file.filename} ({len(file_bytes)} bytes)")
        
        # Process based on file type
        if content_type in ["application/pdf", "application/x-pdf"]:
            result = await ocr_service.extract_text_from_pdf(
                file_bytes,
                dpi=dpi,
                first_page=first_page,
                last_page=last_page
            )
        else:
            # Image file
            result = await ocr_service.extract_text_from_image(file_bytes)
        
        return {
            "success": True,
            "filename": file.filename,
            "text": result.text,
            "confidence": round(result.confidence, 3),
            "confidence_percent": f"{result.confidence * 100:.1f}%",
            "page_count": result.page_count,
            "language": result.language,
            "character_count": len(result.text),
            "word_count": len(result.text.split()) if result.text else 0
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OCR processing failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"OCR-Verarbeitung fehlgeschlagen: {str(e)}"
        )


@router.post("/extract-from-document/{document_id}")
async def extract_text_from_stored_document(
    document_id: str,
    dpi: int = 200,
    user: User = Depends(get_current_user)
) -> Dict:
    """
    Extract text from a document already stored in the system.
    
    Args:
        document_id: ID of the document to process
        dpi: Resolution for PDF conversion
    
    Returns:
        Extracted text with metadata
    """
    from database import db
    
    if not ocr_service.is_available():
        raise HTTPException(
            status_code=503,
            detail="OCR-Dienst ist nicht verfügbar"
        )
    
    # Get document from database
    document = await db.documents.find_one({"document_id": document_id}, {"_id": 0})
    
    if not document:
        raise HTTPException(status_code=404, detail="Dokument nicht gefunden")
    
    # Check if file exists
    file_path = document.get("file_path")
    if not file_path:
        raise HTTPException(status_code=400, detail="Keine Datei mit diesem Dokument verknüpft")
    
    import os
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Datei nicht gefunden")
    
    try:
        # Read file
        with open(file_path, "rb") as f:
            file_bytes = f.read()
        
        file_type = document.get("file_type", "").lower().replace(".", "")
        
        if file_type in ["pdf", "application/pdf"]:
            result = await ocr_service.extract_text_from_pdf(file_bytes, dpi=dpi)
        elif file_type in ["jpg", "jpeg", "png", "tiff", "bmp", "image/jpeg", "image/png"]:
            result = await ocr_service.extract_text_from_image(file_bytes)
        else:
            raise HTTPException(
                status_code=400,
                detail=f"OCR wird für diesen Dateityp nicht unterstützt: {document.get('file_type')}"
            )
        
        # Optionally update document with extracted text
        await db.documents.update_one(
            {"document_id": document_id},
            {"$set": {
                "ocr_text": result.text,
                "ocr_confidence": result.confidence,
                "ocr_language": result.language
            }}
        )
        
        return {
            "success": True,
            "document_id": document_id,
            "filename": document.get("filename"),
            "text": result.text,
            "confidence": round(result.confidence, 3),
            "confidence_percent": f"{result.confidence * 100:.1f}%",
            "page_count": result.page_count,
            "language": result.language,
            "character_count": len(result.text),
            "word_count": len(result.text.split()) if result.text else 0
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OCR for document {document_id} failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"OCR-Verarbeitung fehlgeschlagen: {str(e)}"
        )
