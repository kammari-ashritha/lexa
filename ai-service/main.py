from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import voyageai
import pymongo
import hashlib
import os
import uvicorn

load_dotenv()

app = FastAPI(title="Lexa AI Service v3 — Voyage AI + MongoDB")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Voyage AI ─────────────────────────────────────────────────
print("Connecting to Voyage AI...")
vo = voyageai.Client(api_key=os.environ.get("VOYAGE_API_KEY"))
print("Voyage AI client ready!")
print("Model: voyage-3-lite (512 dimensions)")
print("Reranker: rerank-2")

# ── MongoDB ────────────────────────────────────────────────────
MONGO_URI = os.environ.get("MONGO_URI", "")
mongo_client = None
db = None
if MONGO_URI:
    try:
        mongo_client = pymongo.MongoClient(MONGO_URI)
        db = mongo_client["lexa_db"]
        print("MongoDB connected from AI service")
    except Exception as e:
        print(f"MongoDB connection failed: {e}")

# ── Health ─────────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "service": "Lexa AI Service v3",
        "status":  "running",
        "models": {
            "embedding": "voyage-3-lite",
            "reranking": "rerank-2",
            "provider":  "Voyage AI (MongoDB)"
        }
    }

@app.get("/health")
def health():
    return {"status": "ok", "provider": "voyage-ai", "model": "voyage-3-lite"}

# ── EMBED single ───────────────────────────────────────────────
@app.post("/embed")
async def embed(request: Request):
    data = await request.json()
    text = data.get("text", "").strip()
    if not text:
        return {"error": "text required"}
    try:
        result = vo.embed([text], model="voyage-3-lite", input_type="query")
        embedding = result.embeddings[0]
        return {"embedding": embedding, "dimensions": len(embedding), "model": "voyage-3-lite"}
    except Exception as e:
        print(f"Embed error: {e}")
        return {"error": str(e)}

# ── EMBED batch ────────────────────────────────────────────────
@app.post("/embed-batch")
async def embed_batch(request: Request):
    data  = await request.json()
    texts = data.get("texts", [])
    if not texts:
        return {"embeddings": []}
    try:
        all_embeddings = []
        for i in range(0, len(texts), 128):
            batch  = texts[i:i + 128]
            result = vo.embed(batch, model="voyage-3-lite", input_type="document")
            all_embeddings.extend(result.embeddings)
        return {
            "embeddings": all_embeddings,
            "dimensions": len(all_embeddings[0]) if all_embeddings else 0,
            "model": "voyage-3-lite"
        }
    except Exception as e:
        print(f"Embed-batch error: {e}")
        return {"error": str(e)}

# ── RERANK ─────────────────────────────────────────────────────
@app.post("/rerank")
async def rerank(request: Request):
    data  = await request.json()
    query = data.get("query", "")
    docs  = data.get("docs",  [])
    if not docs or not query:
        return {"docs": docs}
    try:
        reranking = vo.rerank(
            query,
            [doc.get("content", "")[:512] for doc in docs],
            model="rerank-2",
            top_k=min(5, len(docs))
        )
        for r in reranking.results:
            idx = r.index
            relevance = float(r.relevance_score)
            docs[idx]["crossScore"] = round(relevance, 4)
            docs[idx]["finalScore"] = round(
                0.5 * float(docs[idx].get("vectorScore",  0)) +
                0.3 * float(docs[idx].get("lexicalScore", 0)) +
                0.2 * relevance, 4
            )
        reranked = sorted(
            [d for d in docs if "finalScore" in d],
            key=lambda x: x["finalScore"], reverse=True
        )
        print(f"Voyage reranked {len(docs)} docs → top: {reranked[0]['finalScore']:.4f}")
        return {"docs": reranked[:5]}
    except Exception as e:
        print(f"Rerank error: {e}")
        return {"docs": docs}

# ── INGEST ─────────────────────────────────────────────────────
@app.post("/ingest")
async def ingest(request: Request):
    data = await request.json()
    title    = data.get("title", "").strip()
    content  = data.get("content", "").strip()
    category = data.get("category", "General")
    tags     = data.get("tags", [])

    if not title or not content:
        return {"error": "title and content are required"}

    if db is None:
        return {"error": "MongoDB not connected"}

    try:
        collection = db["documents"]

        # ── Dedup check ──────────────────────────────────────
        checksum = hashlib.md5(content.encode()).hexdigest()
        existing = collection.find_one({"checksum": checksum})
        if existing:
            return {
                "message": "Document already exists",
                "duplicate": True,
                "title": title
            }

        # ── Smart chunking ───────────────────────────────────
        words      = content.split()
        chunk_size = 500
        overlap    = 50
        chunks     = []
        i = 0
        while i < len(words):
            chunk = " ".join(words[i:i + chunk_size])
            if len(chunk.split()) >= 20:
                chunks.append(chunk)
            i += chunk_size - overlap
        if not chunks:
            chunks = [content]

        # ── Embed all chunks via Voyage AI ───────────────────
        print(f"Embedding {len(chunks)} chunks for '{title}' using voyage-3-lite...")
        result = vo.embed(chunks, model="voyage-3-lite", input_type="document")
        embeddings = result.embeddings
        print(f"Got {len(embeddings)} embeddings, dims={len(embeddings[0])}")

        # ── Insert to MongoDB ────────────────────────────────
        docs_to_insert = []
        for idx, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            docs_to_insert.append({
                "title":        title,
                "content":      chunk,
                "category":     category,
                "tags":         tags if isinstance(tags, list) else tags.split(","),
                "embedding":    embedding,
                "chunk_index":  idx,
                "total_chunks": len(chunks),
                "word_count":   len(chunk.split()),
                "checksum":     checksum if idx == 0 else None,
                "model":        "voyage-3-lite",
                "dimensions":   len(embedding),
                "created_at":   __import__("datetime").datetime.utcnow()
            })

        collection.insert_many(docs_to_insert)
        print(f"Inserted {len(docs_to_insert)} chunks for '{title}'")

        return {
            "message":    "Document ingested successfully",
            "title":      title,
            "chunks":     len(chunks),
            "dimensions": len(embeddings[0]),
            "model":      "voyage-3-lite",
            "duplicate":  False
        }

    except Exception as e:
        print(f"Ingest error: {e}")
        return {"error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)