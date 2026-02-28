import fitz  # pymupdf
from docx import Document as DocxDocument
from io import BytesIO

def extract_text(content: bytes, filename: str) -> str:
    """Extract plain text from PDF, DOCX, or TXT file bytes."""
    ext = filename.lower().split('.')[-1]

    if ext == 'pdf':
        try:
            doc = fitz.open(stream=content, filetype="pdf")
            pages = [page.get_text() for page in doc]
            return "\n".join(pages).strip()
        except Exception as e:
            raise ValueError(f"PDF extraction failed: {e}")

    elif ext == 'docx':
        try:
            doc = DocxDocument(BytesIO(content))
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            return "\n".join(paragraphs).strip()
        except Exception as e:
            raise ValueError(f"DOCX extraction failed: {e}")

    elif ext == 'txt':
        try:
            return content.decode('utf-8', errors='ignore').strip()
        except Exception as e:
            raise ValueError(f"TXT extraction failed: {e}")

    else:
        raise ValueError(f"Unsupported file type: .{ext}. Use PDF, DOCX, or TXT.")