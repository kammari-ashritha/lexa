import { useState, useRef } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function BulkUpload({ onSuccess }) {
  const [files, setFiles]       = useState([])
  const [category, setCategory] = useState('General')
  const [loading, setLoading]   = useState(false)
  const [jobId, setJobId]       = useState(null)
  const [progress, setProgress] = useState(null)
  const fileRef = useRef()

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files).filter(f =>
      ['pdf','docx','txt'].includes(f.name.split('.').pop().toLowerCase())
    )
    if (selected.length !== e.target.files.length) {
      toast.error('Only PDF, DOCX, TXT files allowed')
    }
    setFiles(selected)
  }

  const toBase64 = (file) => new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result.split(',')[1])
    r.onerror = rej
    r.readAsDataURL(file)
  })

  const handleUpload = async () => {
    if (files.length === 0) { toast.error('Select files first'); return }
    setLoading(true)

    try {
      // Convert all files to base64
      const fileData = await Promise.all(files.map(async (f) => ({
        filename: f.name,
        title: f.name.replace(/\.[^/.]+$/, ''),
        content_b64: await toBase64(f),
        category,
        tags: [category.toLowerCase()]
      })))

      const res = await axios.post(`${API}/documents/bulk`, { files: fileData })
      const { jobId: jid } = res.data
      setJobId(jid)
      pollJob(jid)
    } catch(e) {
      toast.error('Upload failed: ' + (e.response?.data?.error || e.message))
      setLoading(false)
    }
  }

  const pollJob = (jid) => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${API}/documents/job/${jid}`)
        const job = res.data
        setProgress(job)

        if (job.status === 'done' || job.status === 'failed') {
          clearInterval(interval)
          setLoading(false)
          if (job.status === 'done') {
            toast.success(`Uploaded ${job.processed} files successfully!`)
            onSuccess?.()
            setFiles([])
            setProgress(null)
            setJobId(null)
          } else {
            toast.error('Some files failed. Check errors below.')
          }
        }
      } catch(e) {
        clearInterval(interval)
        setLoading(false)
      }
    }, 2000)
  }

  const percent = progress
    ? Math.round((progress.processed / progress.total) * 100)
    : 0

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(124,58,237,0.2)',
      borderRadius: 16, padding: 28
    }}>
      <div style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
        Bulk Upload
      </div>
      <div style={{ color: '#7C6FA0', fontSize: 13, marginBottom: 24 }}>
        Upload multiple PDF, DOCX, or TXT files at once. Each file will be chunked and embedded automatically.
      </div>

      {/* Drop zone */}
      <div
        onClick={() => fileRef.current?.click()}
        style={{
          border: '2px dashed rgba(124,58,237,0.4)',
          borderRadius: 12, padding: '32px 24px',
          textAlign: 'center', cursor: 'pointer',
          marginBottom: 20,
          background: files.length > 0 ? 'rgba(124,58,237,0.05)' : 'transparent',
          transition: 'all 0.2s'
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 10 }}>📁</div>
        <div style={{ color: '#C4B5FD', fontSize: 14, fontWeight: 600 }}>
          {files.length > 0
            ? `${files.length} file${files.length > 1 ? 's' : ''} selected`
            : 'Click to select files'}
        </div>
        <div style={{ color: '#4B5563', fontSize: 12, marginTop: 4 }}>
          PDF, DOCX, TXT supported
        </div>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt"
          onChange={handleFiles}
          style={{ display: 'none' }}
        />
      </div>

      {/* Selected files list */}
      {files.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          {files.map((f, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 8, padding: '8px 12px', marginBottom: 6
            }}>
              <span style={{ color: '#E2D9F3', fontSize: 13 }}>📄 {f.name}</span>
              <span style={{ color: '#4B5563', fontSize: 11 }}>
                {(f.size / 1024).toFixed(1)} KB
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Category */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ color: '#9CA3AF', fontSize: 12, display: 'block', marginBottom: 6 }}>
          Category
        </label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          style={{
            width: '100%', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(124,58,237,0.3)',
            borderRadius: 8, padding: '10px 14px',
            color: '#FFFFFF', fontSize: 14, outline: 'none',
            fontFamily: 'inherit'
          }}
        >
          {['General','HR','Finance','Technology','Medical','Legal','Research'].map(c => (
            <option key={c} value={c} style={{ background: '#1A003A' }}>{c}</option>
          ))}
        </select>
      </div>

      {/* Progress bar */}
      {progress && (
        <div style={{ marginBottom: 20 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            color: '#9CA3AF', fontSize: 12, marginBottom: 6
          }}>
            <span>Processing {progress.processed} / {progress.total} files...</span>
            <span>{percent}%</span>
          </div>
          <div style={{
            height: 8, background: 'rgba(255,255,255,0.08)',
            borderRadius: 4, overflow: 'hidden'
          }}>
            <div style={{
              height: '100%', width: `${percent}%`,
              background: 'linear-gradient(90deg,#7C3AED,#00ED64)',
              borderRadius: 4, transition: 'width 0.4s ease'
            }} />
          </div>
          {progress.errors?.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {progress.errors.map((e, i) => (
                <div key={i} style={{ color: '#EF4444', fontSize: 11 }}>⚠ {e}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload button */}
      <button
        onClick={handleUpload}
        disabled={loading || files.length === 0}
        style={{
          width: '100%', padding: '13px',
          background: loading || files.length === 0
            ? 'rgba(124,58,237,0.3)'
            : 'linear-gradient(135deg,#7C3AED,#A855F7)',
          border: 'none', borderRadius: 10,
          color: '#FFFFFF', fontSize: 15, fontWeight: 700,
          cursor: loading || files.length === 0 ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit', transition: 'all 0.2s'
        }}
      >
        {loading
          ? `Processing... ${percent}%`
          : `Upload ${files.length > 0 ? files.length + ' ' : ''}File${files.length !== 1 ? 's' : ''}`
        }
      </button>
    </div>
  )
}