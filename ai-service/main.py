from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer, CrossEncoder
import numpy as np
import uvicorn

app = FastAPI(title="Lexa AI Service v3")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load models at startup
print("Loading embedding model...")
embed_model = SentenceTransformer('all-MiniLM-L6-v2')
print("Embedding model loaded!")

print("Loading cross-encoder model...")
cross_encoder = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
print("Cross-encoder loaded!")

@app.get("/")
def root():
    return {"service": "Lexa AI Service v3", "status": "running"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/embed")
async def embed(request: Request):
    data = await request.json()
    text = data.get("text", "")
    if not text:
        return {"error": "text required"}
    embedding = embed_model.encode(text, normalize_embeddings=True).tolist()
    return {"embedding": embedding, "dimensions": len(embedding)}

@app.post("/embed-batch")
async def embed_batch(request: Request):
    data = await request.json()
    texts = data.get("texts", [])
    if not texts:
        return {"embeddings": []}
    embeddings = embed_model.encode(texts, normalize_embeddings=True).tolist()
    return {"embeddings": embeddings}

@app.post("/rerank")
async def rerank(request: Request):
    data = await request.json()
    query = data.get("query", "")
    docs = data.get("docs", [])

    if not docs or not query:
        return {"docs": docs}

    try:
        # Create query-document pairs for cross-encoder
        pairs = [[query, doc.get("content", "")[:512]] for doc in docs]
        scores = cross_encoder.predict(pairs)

        # Convert to Python floats
        scores = [float(s) for s in scores]

        # Normalize scores to 0-1 range
        min_s, max_s = min(scores), max(scores)
        score_range = max_s - min_s if max_s != min_s else 1.0
        norm_scores = [(s - min_s) / score_range for s in scores]

        # Combine scores: 50% vector + 30% lexical + 20% cross-encoder
        for i, doc in enumerate(docs):
            doc["crossScore"] = round(norm_scores[i], 4)
            doc["finalScore"] = round(
                0.5 * float(doc.get("vectorScore", 0)) +
                0.3 * float(doc.get("lexicalScore", 0)) +
                0.2 * norm_scores[i],
                4
            )

        # Sort by final score, return top 5
        docs.sort(key=lambda x: x["finalScore"], reverse=True)
        print(f"Reranked {len(docs)} docs, top score: {docs[0]['finalScore']:.4f}")
        return {"docs": docs[:5]}

    except Exception as e:
        print(f"Rerank error: {e}")
        return {"docs": docs}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)