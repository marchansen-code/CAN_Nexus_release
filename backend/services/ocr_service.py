"""
OCR Service using Tesseract (Free, Open-Source)
Extracts text from scanned PDFs and images
"""
import io
import logging
import os
from typing import Optional
from pdf2image import convert_from_bytes
import pytesseract
from PIL import Image
from pydantic import BaseModel

logger = logging.getLogger(__name__)

class OCRResult(BaseModel):
    """OCR extraction result"""
    text: str
    confidence: float
    page_count: int
    language: str = "deu+eng"

class OCRService:
    """Service for extracting text from scanned documents using Tesseract OCR (Free)"""
    
    def __init__(self):
        """Initialize Tesseract OCR"""
        self._available = False
        self._check_tesseract()
        
    def _check_tesseract(self):
        """Check if Tesseract is installed and available"""
        try:
            version = pytesseract.get_tesseract_version()
            logger.info(f"Tesseract OCR initialized: version {version}")
            self._available = True
        except Exception as e:
            logger.warning(f"Tesseract OCR not available: {e}")
            self._available = False
    
    def is_available(self) -> bool:
        """Check if OCR service is available"""
        return self._available
    
    async def extract_text_from_pdf(
        self, 
        pdf_bytes: bytes,
        dpi: int = 200,
        first_page: Optional[int] = None,
        last_page: Optional[int] = None,
        lang: str = "deu+eng"
    ) -> OCRResult:
        """
        Extract text from a scanned PDF using OCR.
        
        Args:
            pdf_bytes: PDF content as bytes
            dpi: Resolution for PDF to image conversion (higher = better quality but slower)
            first_page: First page to process (1-indexed)
            last_page: Last page to process (inclusive)
            lang: Language codes (e.g., 'deu+eng' for German and English)
        
        Returns:
            OCRResult with extracted text and metadata
        """
        if not self._available:
            return OCRResult(
                text="",
                confidence=0.0,
                page_count=0,
                language=lang
            )
        
        try:
            # Convert PDF pages to images
            logger.info(f"Converting PDF to images (DPI: {dpi})")
            images = convert_from_bytes(
                pdf_bytes,
                dpi=dpi,
                first_page=first_page,
                last_page=last_page,
                fmt='jpeg'
            )
            
            if not images:
                logger.warning("No images extracted from PDF")
                return OCRResult(text="", confidence=0.0, page_count=0, language=lang)
            
            logger.info(f"Processing {len(images)} pages with Tesseract OCR")
            
            # Process each page
            all_text_parts = []
            all_confidence_scores = []
            
            for page_idx, image in enumerate(images):
                # Extract text from page
                page_result = await self._extract_text_from_pil_image(image, lang)
                
                if page_result.text:
                    all_text_parts.append(f"--- Seite {page_idx + 1} ---\n{page_result.text}")
                    all_confidence_scores.append(page_result.confidence)
            
            # Calculate overall confidence
            overall_confidence = (
                sum(all_confidence_scores) / len(all_confidence_scores)
                if all_confidence_scores else 0.0
            )
            
            full_text = "\n\n".join(all_text_parts)
            
            logger.info(f"OCR completed: {len(full_text)} characters, confidence: {overall_confidence:.1f}%")
            
            return OCRResult(
                text=full_text,
                confidence=overall_confidence / 100.0,  # Convert to 0-1 scale
                page_count=len(images),
                language=lang
            )
            
        except Exception as e:
            logger.error(f"OCR processing failed: {e}", exc_info=True)
            return OCRResult(text="", confidence=0.0, page_count=0, language=lang)
    
    async def _extract_text_from_pil_image(self, image: Image.Image, lang: str = "deu+eng") -> OCRResult:
        """
        Extract text from a PIL Image using Tesseract.
        
        Args:
            image: PIL Image object
            lang: Language codes
        
        Returns:
            OCRResult for this image
        """
        try:
            # Get text with confidence data
            data = pytesseract.image_to_data(image, lang=lang, output_type=pytesseract.Output.DICT)
            
            # Extract text
            text = pytesseract.image_to_string(image, lang=lang)
            
            # Calculate average confidence (exclude -1 values which indicate no text)
            confidences = [int(c) for c in data['conf'] if int(c) > 0]
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
            
            return OCRResult(
                text=text.strip(),
                confidence=avg_confidence,
                page_count=1,
                language=lang
            )
            
        except Exception as e:
            logger.error(f"Image OCR failed: {e}")
            return OCRResult(text="", confidence=0.0, page_count=1, language=lang)
    
    async def extract_text_from_image(self, image_bytes: bytes, lang: str = "deu+eng") -> OCRResult:
        """
        Extract text from a single image file.
        
        Args:
            image_bytes: Image content as bytes
            lang: Language codes
        
        Returns:
            OCRResult with extracted text
        """
        if not self._available:
            return OCRResult(text="", confidence=0.0, page_count=1, language=lang)
        
        try:
            # Open image from bytes
            image = Image.open(io.BytesIO(image_bytes))
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            return await self._extract_text_from_pil_image(image, lang)
            
        except Exception as e:
            logger.error(f"Image OCR failed: {e}")
            return OCRResult(text="", confidence=0.0, page_count=1, language=lang)


# Singleton instance
ocr_service = OCRService()
