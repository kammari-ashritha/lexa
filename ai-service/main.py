from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from typing import List, Optional
import pymongo
import os
from dotenv import load_dotenv
import uvicorn

load_dotenv()

app = FastAPI(title="Lexa AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("⏳ Loading sentence-transformer model...")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("✅ Model loaded!")

MONGO_URI = os.getenv("MONGO_URI")
mongo_client = pymongo.MongoClient(MONGO_URI)
db = mongo_client["lexa_db"]
documents_col = db["documents"]

# ─────────────────────────────────────────────
# MODELS
# ─────────────────────────────────────────────
class EmbedRequest(BaseModel):
    text: str

class IngestRequest(BaseModel):
    title: str
    content: str
    category: Optional[str] = "General"
    tags: Optional[List[str]] = []

class BulkIngestRequest(BaseModel):
    documents: List[IngestRequest]

# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────
def smart_chunk(text: str, chunk_size: int = 400, overlap: int = 80):
    """Split text into overlapping chunks for better semantic coverage."""
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        if chunk.strip():
            chunks.append(chunk)
        start += chunk_size - overlap
    return chunks if chunks else [text]

def generate_embedding(text: str) -> List[float]:
    return model.encode(text, normalize_embeddings=True).tolist()

# ─────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "service": "Lexa AI Service",
        "status": "running",
        "model": "all-MiniLM-L6-v2",
        "dimensions": 384
    }

@app.get("/health")
def health():
    return {"status": "healthy", "model_loaded": True}

@app.post("/embed")
def embed_text(req: EmbedRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    embedding = generate_embedding(req.text)
    return {
        "embedding": embedding,
        "dimensions": len(embedding),
        "text_preview": req.text[:100]
    }

@app.post("/ingest")
def ingest_document(req: IngestRequest):
    if not req.title.strip() or not req.content.strip():
        raise HTTPException(status_code=400, detail="Title and content required")

    # Remove old chunks for same title (re-ingest)
    documents_col.delete_many({"title": req.title})

    chunks = smart_chunk(req.content)
    docs_to_insert = []

    for i, chunk in enumerate(chunks):
        embedding = generate_embedding(chunk)
        doc = {
            "title": req.title,
            "content": chunk,
            "chunk_index": i,
            "total_chunks": len(chunks),
            "category": req.category,
            "tags": req.tags,
            "embedding": embedding,
            "word_count": len(chunk.split()),
        }
        docs_to_insert.append(doc)

    if docs_to_insert:
        documents_col.insert_many(docs_to_insert)

    return {
        "success": True,
        "title": req.title,
        "category": req.category,
        "chunks_created": len(chunks),
        "total_vectors": len(docs_to_insert)
    }

@app.post("/ingest/bulk")
def bulk_ingest(req: BulkIngestRequest):
    results = []
    errors = []
    for doc_req in req.documents:
        try:
            result = ingest_document(doc_req)
            results.append(result)
        except Exception as e:
            errors.append({"title": doc_req.title, "error": str(e)})
    return {
        "success": True,
        "ingested": len(results),
        "errors": len(errors),
        "results": results,
        "error_details": errors
    }

@app.delete("/documents/clear")
def clear_all():
    result = documents_col.delete_many({})
    return {"deleted_count": result.deleted_count}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)