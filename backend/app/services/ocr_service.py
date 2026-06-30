"""
OCR Service - Extract text from uploaded bills (images + PDFs)
Uses Tesseract for local OCR and optionally Claude Vision API
"""
import io
import base64
from pathlib import Path
import pytesseract
from PIL import Image
import fitz  # PyMuPDF
from loguru import logger
from app.utils.config import settings


class OCRService:
    """Handles OCR extraction from images and PDFs."""

    def __init__(self):
        pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD

    def pdf_to_images(self, pdf_bytes: bytes) -> list[Image.Image]:
        """Convert PDF pages to PIL Images."""
        images = []
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        for page in doc:
            pix = page.get_pixmap(dpi=300)
            img_bytes = pix.tobytes("png")
            images.append(Image.open(io.BytesIO(img_bytes)))
        doc.close()
        return images

    def ocr_image(self, image: Image.Image) -> str:
        """Run Tesseract OCR on a PIL Image."""
        config = r"--oem 3 --psm 6"
        return pytesseract.image_to_string(image, config=config)

    def extract_text(self, file_bytes: bytes, file_type: str) -> str:
        """Extract raw text from file bytes."""
        try:
            if file_type in ("jpg", "jpeg", "png", "bmp", "tiff"):
                image = Image.open(io.BytesIO(file_bytes))
                text = self.ocr_image(image)
            elif file_type == "pdf":
                # Try extracting embedded text first (faster)
                doc = fitz.open(stream=file_bytes, filetype="pdf")
                text = ""
                for page in doc:
                    text += page.get_text()
                doc.close()

                # Fallback to OCR if text is sparse
                if len(text.strip()) < 100:
                    logger.info("PDF has sparse text, falling back to OCR")
                    images = self.pdf_to_images(file_bytes)
                    text = "\n\n--- PAGE BREAK ---\n\n".join(
                        self.ocr_image(img) for img in images
                    )
            else:
                raise ValueError(f"Unsupported file type: {file_type}")

            logger.info(f"OCR extracted {len(text)} characters")
            return text.strip()

        except Exception as e:
            logger.error(f"OCR failed: {e}")
            raise

    def image_to_base64(self, image: Image.Image) -> str:
        """Convert PIL Image to base64 for Vision API."""
        buf = io.BytesIO()
        image.save(buf, format="PNG")
        return base64.b64encode(buf.getvalue()).decode()


ocr_service = OCRService()
