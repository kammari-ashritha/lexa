from fastapi import APIRouter, Request

router = APIRouter()

# embed_model is loaded in main.py and passed here
_model = None

def set_model(model):
    global _model
    _model = model

async def embed_text(request: Request):
    data = await request.json()
    text = data.get("text", "").strip()
    if not text:
        return {"error": "text is required"}
    embedding = _model.encode(text, normalize_embeddings=True).tolist()
    return {"embedding": embedding, "dimensions": len(embedding)}

async def embed_batch(request: Request):
    data = await request.json()
    texts = data.get("texts", [])
    if not texts:
        return {"embeddings": []}
    embeddings = _model.encode(texts, normalize_embeddings=True).tolist()
    return {"embeddings": embeddings}