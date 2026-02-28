import hashlib

def get_checksum(text: str) -> str:
    """Generate MD5 hash of text content for duplicate detection."""
    return hashlib.md5(text.encode('utf-8')).hexdigest()

def is_duplicate(db, checksum: str) -> bool:
    """Check if a document with this checksum already exists in MongoDB."""
    existing = db['documents'].find_one({"checksum": checksum})
    return existing is not None