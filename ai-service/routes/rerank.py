_cross_encoder = None

def set_cross_encoder(model):
    global _cross_encoder
    _cross_encoder = model

async def rerank_docs(request):
    from fastapi import Request
    data = await request.json()
    query = data.get("query", "")
    docs  = data.get("docs", [])

    if not docs or not query:
        return {"docs": docs}

    try:
        pairs = [[query, doc.get("content", "")[:512]] for doc in docs]
        scores = _cross_encoder.predict(pairs)
        scores = [float(s) for s in scores]

        min_s = min(scores)
        max_s = max(scores)
        score_range = max_s - min_s if max_s != min_s else 1.0
        norm = [(s - min_s) / score_range for s in scores]

        for i, doc in enumerate(docs):
            doc["crossScore"] = round(norm[i], 4)
            doc["finalScore"] = round(
                0.5 * float(doc.get("vectorScore", 0)) +
                0.3 * float(doc.get("lexicalScore", 0)) +
                0.2 * norm[i],
                4
            )

        docs.sort(key=lambda x: x["finalScore"], reverse=True)
        return {"docs": docs[:5]}

    except Exception as e:
        print(f"Rerank error: {e}")
        return {"docs": docs}