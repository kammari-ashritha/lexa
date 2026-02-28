import uuid
from datetime import datetime

# In-memory store: { jobId: { status, total, processed, errors, createdAt } }
job_store = {}

def create_job(total_files: int, user_id: str = None) -> str:
    """Create a new job and return its ID."""
    job_id = str(uuid.uuid4())
    job_store[job_id] = {
        "jobId": job_id,
        "userId": user_id,
        "status": "processing",
        "total": total_files,
        "processed": 0,
        "errors": [],
        "createdAt": datetime.utcnow().isoformat()
    }
    return job_id

def update_job(job_id: str, processed: int = None, error: str = None, done: bool = False):
    """Update job progress."""
    if job_id not in job_store:
        return
    if processed is not None:
        job_store[job_id]["processed"] = processed
    if error:
        job_store[job_id]["errors"].append(error)
    if done:
        job_store[job_id]["status"] = "done"

def get_job(job_id: str) -> dict:
    """Get job status by ID."""
    return job_store.get(job_id, {"status": "not_found"})

def increment_job(job_id: str):
    """Increment processed count by 1."""
    if job_id in job_store:
        job_store[job_id]["processed"] += 1