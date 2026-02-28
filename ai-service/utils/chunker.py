from typing import List

def smart_chunk(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """
    Split text into overlapping word-based chunks.
    chunk_size: target words per chunk
    overlap: words to repeat from previous chunk (context continuity)
    """
    if not text or not text.strip():
        return []

    words = text.split()
    if len(words) <= chunk_size:
        return [text.strip()]

    chunks = []
    start = 0

    while start < len(words):
        end = min(start + chunk_size, len(words))
        chunk = ' '.join(words[start:end])
        chunks.append(chunk.strip())

        if end >= len(words):
            break

        # Move forward by chunk_size minus overlap
        start += chunk_size - overlap

    return [c for c in chunks if len(c.split()) > 20]  # skip tiny chunks