
import { useState, useRef } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const CATEGORIES = ['General','Technology','Finance','Healthcare','Legal','Science','Business','Education']

const IconUpload = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{width:15,height:15}}>
    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
)
const IconX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}>
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IconFile = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
)
const IconLoader = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,animation:'spin 0.9s linear infinite'}}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
)
const IconPlus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}}>
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

export default function UploadModal({ onClose, onSuccess }) {
  const [title, setTitle]       = useState('')
  const [content, setContent]   = useState('')
  const [category, setCategory] = useState('General')
  const [tags, setTags]         = useState('')
  const [loading, setLoading]   = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef                 = useRef()

  const handleFile = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => {
      setContent(e.target.result)
      if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ''))
    }
    reader.readAsText(file)
    toast.success(`"${file.name}" loaded!`)
  }

  const submit = async () => {
    if (!title.trim() || !content.trim()) { toast.error('Title and content are required'); return }
    setLoading(true)
    try {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean)
      const res = await axios.post('http://localhost:5000/api/documents/ingest', {
        title: title.trim(), content: content.trim(), category, tags: tagList
      }, { timeout: 120000 })
      toast.success(`✅ "${title}" ingested! ${res.data.chunks_created} chunks created.`)
      onSuccess()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Ingestion failed')
    } finally { setLoading(false) }
  }

  const wordCount = content.split(/\s+/).filter(Boolean).length
  const chunkEst  = Math.max(1, Math.ceil(wordCount / 350))

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">

        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-row">
            <div className="modal-icon"><IconUpload /></div>
            <div>
              <div className="modal-title">Upload Document</div>
              <div className="modal-subtitle">Will be chunked &amp; vectorized automatically</div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><IconX /></button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Title */}
          <div>
            <div className="form-label">Document Title *</div>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Annual Financial Report 2024"
            />
          </div>

          {/* Category + Tags */}
          <div className="form-grid">
            <div>
              <div className="form-label">Category</div>
              <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <div className="form-label">Tags (comma separated)</div>
              <input
                type="text"
                className="form-input"
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="AI, finance, 2024"
              />
            </div>
          </div>

          {/* Drop zone */}
          <div>
            <div className="form-label">Content *</div>
            <div
              className={`dropzone${dragOver ? ' drag-over' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
              onClick={() => fileRef.current.click()}
            >
              <div className="dropzone-icon"><IconFile /></div>
              <div className="dropzone-text">
                Drop a <span>.txt / .md</span> file here or <span>click to browse</span>
              </div>
              <input ref={fileRef} type="file" accept=".txt,.md,.csv" style={{display:'none'}}
                onChange={e => handleFile(e.target.files[0])} />
            </div>
            <textarea
              className="form-textarea"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Or paste your document content here..."
              rows={6}
            />
            {content && (
              <div className="word-count">
                {wordCount.toLocaleString()} words · ~{chunkEst} chunk{chunkEst !== 1 ? 's' : ''} will be created
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button
            className="btn-ingest"
            onClick={submit}
            disabled={loading || !title.trim() || !content.trim()}
          >
            {loading ? <><IconLoader /> Vectorizing...</> : <><IconPlus /> Ingest Document</>}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}