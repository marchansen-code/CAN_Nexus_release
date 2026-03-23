"""
OCR Service using Google Cloud Vision API
Extracts text from scanned PDFs and images
"""
import io
import logging
import os
from typing import List, Optional
from pdf2image import convert_from_bytes
from google.cloud import vision
from pydantic import BaseModel

logger = logging.getLogger(__name__)

class OCRResult(BaseModel):
    """OCR extraction result"""
    text: str
    confidence: float
    page_count: int
    language: str = "unknown"

class OCRService:
    """Service for extracting text from scanned documents using Google Cloud Vision"""
    
    def __init__(self):
        """Initialize Vision API client"""
        self.client = None
        self._initialized = False
        
    def _ensure_initialized(self):
        """Lazy initialization of Vision client"""
        if not self._initialized:
            try:
                # Check for credentials
                credentials_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
                if credentials_path and os.path.exists(credentials_path):
                    self.client = vision.ImageAnnotatorClient()
                    self._initialized = True
                    logger.info("Google Cloud Vision client initialized")
                else:
                    logger.warning("Google Cloud Vision credentials not found. OCR will not be available.")
            except Exception as e:
                logger.error(f"Failed to initialize Vision client: {e}")
    
    def is_available(self) -> bool:
        """Check if OCR service is available"""
        self._ensure_initialized()
        return self._initialized and self.client is not None
    
    async def extract_text_from_pdf(
        self, 
        pdf_bytes: bytes,
        dpi: int = 200,
        first_page: Optional[int] = None,
        last_page: Optional[int] = None
    ) -> OCRResult:
        """
        Extract text from a scanned PDF using OCR.
        
        Args:
            pdf_bytes: PDF content as bytes
            dpi: Resolution for PDF to image conversion (higher = better quality but slower)
            first_page: First page to process (1-indexed)
            last_page: Last page to process (inclusive)
        
        Returns:
            OCRResult with extracted text and metadata
        """
        self._ensure_initialized()
        
        if not self.client:
            return OCRResult(
                text="",
                confidence=0.0,
                page_count=0,
                language="unknown"
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
                return OCRResult(text="", confidence=0.0, page_count=0)
            
            logger.info(f"Processing {len(images)} pages with Vision API")
            
            # Process each page
            all_text_parts = []
            all_confidence_scores = []
            detected_language = "unknown"
            
            for page_idx, image in enumerate(images):
                # Convert PIL Image to bytes
                img_byte_arr = io.BytesIO()
                image.save(img_byte_arr, format='JPEG', quality=85)
                img_byte_arr.seek(0)
                image_content = img_byte_arr.getvalue()
                
                # Extract text from page
                page_result = await self._extract_text_from_image(image_content)
                
                if page_result.text:
                    all_text_parts.append(page_result.text)
                    all_confidence_scores.append(page_result.confidence)
                    if page_result.language != "unknown":
                        detected_language = page_result.language
            
            # Calculate overall confidence
            overall_confidence = (
                sum(all_confidence_scores) / len(all_confidence_scores)
                if all_confidence_scores else 0.0
            )
            
            full_text = "\n\n--- Seite ---\n\n".join(all_text_parts)
            
            logger.info(f"OCR completed: {len(full_text)} characters, confidence: {overall_confidence:.2f}")
            
            return OCRResult(
                text=full_text,
                confidence=overall_confidence,
                page_count=len(images),
                language=detected_language
            )
            
        except Exception as e:
            logger.error(f"OCR processing failed: {e}", exc_info=True)
            return OCRResult(text="", confidence=0.0, page_count=0)
    
    async def _extract_text_from_image(self, image_content: bytes) -> OCRResult:
        """
        Extract text from a single image using Vision API.
        
        Args:
            image_content: Image bytes (JPEG/PNG)
        
        Returns:
            OCRResult for this image
        """
        try:
            # Prepare image for Vision API
            image = vision.Image(content=image_content)
            
            # Use DOCUMENT_TEXT_DETECTION for better results on documents
            response = self.client.document_text_detection(image=image)
            
            # Check for errors
            if response.error.message:
                logger.error(f"Vision API error: {response.error.message}")
                return OCRResult(text="", confidence=0.0, page_count=1)
            
            # Extract text and confidence
            if not response.full_text_annotation:
                return OCRResult(text="", confidence=0.0, page_count=1)
            
            document = response.full_text_annotation
            full_text = document.text
            
            # Calculate average confidence from pages
            confidence_scores = []
            detected_language = "unknown"
            
            for page in document.pages:
                # Get detected language
                if page.property and page.property.detected_languages:
                    lang = page.property.detected_languages[0]
                    detected_language = lang.language_code
                
                # Collect word confidences
                for block in page.blocks:
                    for paragraph in block.paragraphs:
                        for word in paragraph.words:
                            if hasattr(word, 'confidence'):
                                confidence_scores.append(word.confidence)
            
            avg_confidence = (
                sum(confidence_scores) / len(confidence_scores)
                if confidence_scores else 0.8  # Default if no confidence data
            )
            
            return OCRResult(
                text=full_text,
                confidence=avg_confidence,
                page_count=1,
                language=detected_language
            )
            
        except Exception as e:
            logger.error(f"Image OCR failed: {e}")
            return OCRResult(text="", confidence=0.0, page_count=1)
    
    async def extract_text_from_image(self, image_bytes: bytes) -> OCRResult:
        """
        Extract text from a single image file.
        
        Args:
            image_bytes: Image content as bytes
        
        Returns:
            OCRResult with extracted text
        """
        self._ensure_initialized()
        
        if not self.client:
            return OCRResult(text="", confidence=0.0, page_count=1)
        
        return await self._extract_text_from_image(image_bytes)


# Singleton instance
ocr_service = OCRService()
