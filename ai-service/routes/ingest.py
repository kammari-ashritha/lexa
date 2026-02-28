import asyncio
import base64
from datetime import datetime
from pymongo import MongoClient
from .extractor import extract_text
from .chunker import smart_chunk
from .dedup import get_checksum, is_duplicate
from .jobs import create_job, increment_job, update_job, job_store

_embed_model = None
_mongo_uri   = None

def set_embed_model(model):
    global _embed_model
    _embed_model = model

def set_mongo_uri(uri):
    global _mongo_uri
    _mongo_uri = uri

async def bulk_ingest(request):
    data  = await request.json()
    files = data.get("files", [])
    if not files:
        return {"error": "No files provided"}

    job_id = create_job(len(files), data.get("userId"))
    asyncio.create_task(_process_files(job_id, files))
    return {"jobId": job_id, "status": "started", "total": len(files)}

async def _process_files(job_id: str, files: list):
    try:
        client = MongoClient(_mongo_uri)
        db = client["lexa_db"]

        for i, file_data in enumerate(files):
            try:
                content  = base64.b64decode(file_data["content_b64"])
                filename = file_data.get("filename", f"file_{i}.txt")
                text     = extract_text(content, filename)
                checksum = get_checksum(text)

                if is_duplicate(db, checksum):
                    print(f"Skipping duplicate: {filename}")
                    increment_job(job_id)
                    continue

                chunks = smart_chunk(text)
                docs_to_insert = []

                for idx, chunk in enumerate(chunks):
                    embedding = _embed_model.encode(chunk, normalize_embeddings=True).tolist()
                    docs_to_insert.append({
                        "title":       file_data.get("title", filename.rsplit('.', 1)[0]),
                        "content":     chunk,
                        "category":    file_data.get("category", "General"),
                        "tags":        file_data.get("tags", []),
                        "chunk_index": idx,
                        "total_chunks":len(chunks),
                        "word_count":  len(chunk.split()),
                        "embedding":   embedding,
                        "checksum":    checksum,
                        "sourceFile":  filename,
                        "uploadedBy":  file_data.get("userId"),
                        "uploadDate":  datetime.utcnow()
                    })

                if docs_to_insert:
                    db["documents"].insert_many(docs_to_insert)

                increment_job(job_id)
                print(f"Ingested: {filename} ({len(chunks)} chunks)")

            except Exception as e:
                update_job(job_id, error=f"{file_data.get('filename','?')}: {str(e)}")
                increment_job(job_id)

        job_store[job_id]["status"] = "done"
        client.close()

    except Exception as e:
        job_store[job_id]["status"] = "failed"
        job_store[job_id]["errors"].append(str(e))